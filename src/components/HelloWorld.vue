<template>
  <v-container>
    <v-row>
      <v-autocomplete
        v-model="selectedTicker"
        :items="listOfLabels"
        label="Stocks"
        auto-select-first
        chips
        clearable
        multiple
        no-data-text="No results"
        @change="loadHistory"
      ></v-autocomplete>

      <div class="small">
        <LineChart v-if="loaded" :chart-data="chartData" />
      </div>
    </v-row>
  </v-container>
</template>

<script>
const TOKEN = require("../configs/token.json");
import LineChart from "./Chart.vue";

export default {
  name: "HelloWorld",

  data: () => ({
    instruments: [],
    selectedTicker: [],
    headers: {
      Authorization: "Bearer " + TOKEN.token,
      "Content-type": "application/json",
    },
    datacollection: null,
    loaded: false,
  }),

  methods: {
    ticketsFetch() {
      const URL = "https://api-invest.tinkoff.ru/openapi/sandbox/market/stocks";
      const OPTIONS = {
        method: "GET",
        headers: this.headers,
      };

      this.fetchData(URL, OPTIONS).then((result) =>
        result.payload.instruments.forEach(({ figi, ticker }) =>
          this.instruments.push({ figi: figi, ticker: ticker })
        )
      );
    },

    fetchData(URL, OPTIONS) {
      return fetch(URL, OPTIONS).then((response) => response.json());
    },

    loadHistory() {
      this.loaded = false;
      this.selectedTicker.forEach((ticker) => {
        const checkCandles = this.checkCandles(ticker);

        if (checkCandles) {
          this.loaded = true;
          return;
        }

        this.loadHistoryByTicker(ticker);
      });
      console.log(this.chartData);
    },

    loadHistoryByTicker(ticker) {
      const URL =
        "https://api-invest.tinkoff.ru/openapi/sandbox/market/candles";
      const OPTIONS = {
        method: "GET",
        headers: this.headers,
      };
      const PARAMS = {
        figi: this.getFigiByTicker(ticker),
        from: new Date(2016, 0, 1, 0, 0, 0, 0).toISOString(),
        to: new Date().toISOString(),
        interval: "month",
      };

      const urlParams = URL + "?" + new URLSearchParams(PARAMS).toString();

      this.fetchData(urlParams, OPTIONS).then((result) => {
        this.$set(
          this.instruments[
            this.instruments.findIndex(
              (instrument) => instrument.figi == result.payload.figi
            )
          ],
          "candles",
          result.payload.candles.map((candle) => {
            return {
              close: candle.c,
              time:
                this.formatDate(new Date(candle.time).getDate()) +
                "." +
                this.formatDate(new Date(candle.time).getMonth() + 1) +
                "." +
                new Date(candle.time).getFullYear(),
            };
          })
        );
        this.loaded = true;
      });
    },

    getFigiByTicker(ticker) {
      return this.instruments.filter((item) => item.ticker == ticker)[0].figi;
    },

    checkCandles(ticker) {
      return this.instruments[
        this.instruments.findIndex((instrument) => instrument.ticker == ticker)
      ].candles?.length;
    },

    formatDate(date) {
      return date.toString().length > 1 ? date : "0" + date;
    },
  },

  computed: {
    listOfLabels() {
      if (this.instruments.length === 0) return [];
      return this.instruments.map((item) => item.ticker).sort();
    },
    instrumentsWithCandles() {
      return this.instruments.filter((instrument) =>
        this.checkCandles(instrument.ticker)
      );
    },

    chartData() {
      if (this.selectedTicker.length == 0) return {};
      return {
        labels: this.chartLabels,
        datasets: this.chartDataset,
      };
    },
    chartLabels() {
      return this.instruments[
        this.instruments.findIndex(
          (item) => item.ticker === this.selectedTicker[0]
        )
      ].candles.map(({ time }) => time);
    },

    chartDataset() {
      return this.selectedTicker.map((selected) => {
        const instrument =
          this.instruments[
            this.instruments.findIndex(
              (instrument) => instrument.ticker === selected
            )
          ];
        return {
          label: instrument.ticker,
          backgroundColor: "#f87979",
          data: instrument.candles?.map(({ close }) => close),
        };
      });
    },
  },

  created() {
    this.ticketsFetch();
  },

  components: {
    LineChart,
  },
};
</script>

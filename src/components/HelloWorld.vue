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
    </v-row>
    <v-row>
      <div :class="$style.chartBox">
        <LineChart
          :class="$style.chart"
          v-if="showChart"
          :chart-data="chartContent"
          :options="chartOptions"
        />
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
    chartOptions: {
      maintainAspectRatio: false,
    },
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
      this.selectedTicker.forEach((ticker) => {
        const checkCandles = this.checkCandles(ticker);

        if (checkCandles) {
          return;
        }

        this.loadHistoryByTicker(ticker);
      });
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

    randomColor() {
      return `rgba(
            ${Math.random() * 255}, 
            ${Math.random() * 255},
            ${Math.random() * 255}, 0.5)`;
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

    chartContent() {
      if (this.selectedTicker.length == 0) return {};
      return {
        labels: this.chartLabels,
        datasets: this.chartDataset,
      };
    },

    chartLabels() {
      return this.instruments[
        this.instruments.findIndex(
          (instrument) =>
            instrument.candles?.length === this.maxCandleLength &&
            this.selectedTicker.indexOf(instrument.ticker) !== -1
        )
      ].candles.map(({ time }) => time);
    },

    maxCandleLength() {
      return Math.max(
        ...this.instruments
          .filter((instrument) => {
            return (
              instrument.candles &&
              this.selectedTicker.indexOf(instrument.ticker) !== -1
            );
          })
          .map((instrument) => instrument.candles.length)
      );
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
          backgroundColor: this.randomColor(),
          data: new Array(this.maxCandleLength - instrument.candles?.length)
            .fill("")
            .concat(instrument.candles?.map(({ close }) => close)),
        };
      });
    },

    showChart() {
      if (this.selectedTicker.length == 0) return false;

      let flag = true;

      this.selectedTicker.forEach((ticker) => {
        if (this.checkCandles(ticker) === undefined) {
          flag = false;
        }
      });

      return flag;
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

<style module>
.chart {
  position: relative;
  height: 400px;
  width: 90vw;
  max-width: 100%;
}

.chartBox {
  margin: 0 auto;
}
</style>
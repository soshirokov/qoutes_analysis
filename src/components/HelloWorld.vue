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
import LineChart from "./Chart.vue";
import { mapGetters, mapActions } from "vuex";

export default {
  name: "HelloWorld",

  data: () => ({
    selectedTicker: [],
    datacollection: null,
    chartOptions: {
      maintainAspectRatio: false,
    },
  }),

  methods: {
    ...mapActions(["instrumentsFetch", "fetchData", "loadHistoryByTicker"]),

    loadHistory() {
      this.selectedTicker.forEach((ticker) => {
        const checkCandles = this.checkCandles(ticker);

        if (checkCandles) {
          return;
        }

        this.loadHistoryByTicker(ticker);
      });
    },

    checkCandles(ticker) {
      return this.instruments[
        this.instruments.findIndex((instrument) => instrument.ticker == ticker)
      ].candles?.length;
    },

    randomColor() {
      return `rgba(
            ${Math.random() * 255}, 
            ${Math.random() * 255},
            ${Math.random() * 255}, 0.5)`;
    },
  },

  computed: {
    ...mapGetters(["instruments"]),

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
            .concat(instrument.candles?.map(({ percentage }) => percentage)),
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
    this.instrumentsFetch();
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
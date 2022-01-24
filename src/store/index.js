import Vue from 'vue';
import Vuex from 'vuex';
const TOKEN = require("../configs/token.json");

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    instruments: [],
    headers: {
      Authorization: "Bearer " + TOKEN.token,
      "Content-type": "application/json",
    },
  },

  getters: {
    instruments: ({ instruments }) => instruments,
    headers: ({ headers }) => headers,
    getFigiByTicker: ({ instruments }) => ticker => instruments.filter((item) => item.ticker == ticker)[0].figi,
    nice: () => date => date,
  },

  mutations: {
    ADD_INSTRUMENTS(state, payload) {
      payload.forEach(({ figi, ticker }) => {
        state.instruments.push({ figi: figi, ticker: ticker });
      });

      state.instruments.push(payload);
    },

    ADD_CANDLES({ instruments }, payload) {
      const dateFormat = date => date.toString().length > 1 ? date : "0" + date;

      const firstClose = payload.candles[0].c;

      Vue.set(instruments[
        instruments.findIndex(
          (instrument) => instrument.figi == payload.figi
        )
      ],
        "candles",
        payload.candles.map((candle) => {
          return {
            close: candle.c,
            time:
              dateFormat(new Date(candle.time).getDate()) +
              "." +
              dateFormat(new Date(candle.time).getMonth() + 1) +
              "." +
              new Date(candle.time).getFullYear(),
            percentage: (candle.c / firstClose * 100).toFixed(2),
          };
        }));
    },
  },

  actions: {
    fetchData(state, { URL, OPTIONS }) {
      return fetch(URL, OPTIONS).then((response) => response.json());
    },

    instrumentsFetch({ dispatch, getters, commit }) {
      const URL = "https://api-invest.tinkoff.ru/openapi/sandbox/market/stocks";
      const OPTIONS = {
        method: "GET",
        headers: getters.headers,
      };

      dispatch('fetchData', { URL, OPTIONS }).then((result) =>
        commit('ADD_INSTRUMENTS', result.payload.instruments)
      );
    },

    loadHistoryByTicker({ dispatch, getters, commit }, ticker) {
      let URL = "https://api-invest.tinkoff.ru/openapi/sandbox/market/candles";
      const OPTIONS = {
        method: "GET",
        headers: getters.headers,
      };
      const PARAMS = {
        figi: getters.getFigiByTicker(ticker),
        from: new Date(2016, 0, 1, 0, 0, 0, 0).toISOString(),
        to: new Date().toISOString(),
        interval: "month",
      };

      URL = URL + "?" + new URLSearchParams(PARAMS).toString();

      dispatch('fetchData', { URL, OPTIONS }).then((result) => {
        commit('ADD_CANDLES', result.payload);
      });
    },
  },

  modules: {
  }
})

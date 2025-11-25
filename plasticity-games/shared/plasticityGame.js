// plasticityGame.js - shared helper stub for Plasticity HTML games
// This is a minimal version; you'll likely extend it via Codex prompts.

(function (global) {
  var PlasticityGame = {
    _config: null,
    _events: [],

    init: function (config) {
      this._config = config || {};
      console.log("[PlasticityGame] init", this._config);
    },

    logEvent: function (event) {
      if (!event || typeof event !== "object") return;
      this._events.push(event);
      // Debug postMessage for harness / shell
      try {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage(
            { type: "GAME_EVENT_DEBUG", payload: event },
            "*"
          );
        }
      } catch (e) {
        console.warn("PlasticityGame.logEvent postMessage failed", e);
      }
    },

    end: function (result) {
      result = result || {};
      var message = {
        type: "GAME_RESULT",
        gameId: (this._config && this._config.gameId) || "unknown-game",
        sessionId: (this._config && this._config.sessionId) || "debug-session",
        result: result,
        events: this._events.slice()
      };
      console.log("[PlasticityGame] end", message);
      try {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage(message, "*");
        }
      } catch (e) {
        console.warn("PlasticityGame.end postMessage failed", e);
      }
    }
  };

  global.PlasticityGame = PlasticityGame;
})(window);

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const coreJs = path.join(root, "node_modules/@capacitor/core/dist/capacitor.js");
const www = path.join(root, "www");

if (!fs.existsSync(coreJs)) {
  console.warn("skip cap www: @capacitor/core not installed");
  process.exit(0);
}

fs.copyFileSync(coreJs, path.join(www, "capacitor.js"));

const capApp = `(function () {
  function emit(name) {
    window.dispatchEvent(new CustomEvent(name));
  }
  function bind(App) {
    App.addListener("appStateChange", function (state) {
      emit(state.isActive ? "game:resume" : "game:pause");
    });
    App.addListener("resume", function () { emit("game:resume"); });
    App.addListener("pause", function () { emit("game:pause"); });
  }
  function tryBind() {
    var C = window.Capacitor;
    if (!C) return false;
    var App = typeof C.registerPlugin === "function"
      ? C.registerPlugin("App")
      : (C.Plugins && C.Plugins.App);
    if (!App || !App.addListener) return false;
    bind(App);
    return true;
  }
  if (!tryBind()) {
    var n = 0;
    var id = setInterval(function () {
      if (tryBind() || ++n > 100) clearInterval(id);
    }, 50);
  }
})();
`;

fs.writeFileSync(path.join(www, "cap-app.js"), capApp, "utf8");
console.log("wrote www/capacitor.js and www/cap-app.js");

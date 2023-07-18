const { src, dest, series, watch, parallel } = require("gulp");
const { readFileSync } = require("fs");
const fs = require("fs");
const del = require("del");
const sass = require("gulp-sass");
const notify = require("gulp-notify");
const autoprefixer = require("gulp-autoprefixer");
const cleanCSS = require("gulp-clean-css");
const sourcemaps = require("gulp-sourcemaps");
const browserSync = require("browser-sync").create();
const fileInclude = require("gulp-file-include");
const svgSprite = require("gulp-svg-sprite");
const ttf2woff2 = require("gulp-ttf2woff2");
const uglify = require("gulp-uglify-es").default;
const babel = require("gulp-babel");
const rev = require("gulp-rev");
const revRewrite = require("gulp-rev-rewrite");
const revDel = require("gulp-rev-delete-original");
const htmlmin = require("gulp-htmlmin");
const gulpif = require("gulp-if");
const image = require("gulp-image");
const concat = require("gulp-concat");
const imagemin = require("gulp-imagemin");
const webp = require("gulp-webp");
const webphtml = require("gulp-webp-html");
const webpcss = require("gulp-webpcss");

let isProd = false; // dev by default
let project_folder = require("path").basename(__dirname);
let source_folder = "src";

const clean = () => {
  return del([project_folder + "/*"]);
};

const svgSprites = () => {
  return src("./" + source_folder + "/img/svg/**.svg")
    .pipe(
      svgSprite({
        mode: {
          stack: {
            sprite: "../sprite.svg", //sprite file name
          },
        },
      })
    )
    .pipe(dest("./" + project_folder + "/img"));
};

const styles = () => {
  return src("./" + source_folder + "/scss/**/*.scss")
    .pipe(gulpif(!isProd, sourcemaps.init()))
    .pipe(sass().on("error", notify.onError()))
    .pipe(
      autoprefixer({
        cascade: false,
      })
    )
    .pipe(webpcss())
    .pipe(gulpif(isProd, cleanCSS({ level: 2 })))
    .pipe(gulpif(!isProd, sourcemaps.write(".")))
    .pipe(dest("./" + project_folder + "/css/"))
    .pipe(browserSync.stream());
};

const stylesBackend = () => {
  return src("./" + source_folder + "/scss/**/*.scss")
    .pipe(sass().on("error", notify.onError()))
    .pipe(
      autoprefixer({
        cascade: false,
      })
    )
    .pipe(dest("./" + project_folder + "/css/"));
};

const scripts = () => {
  src("./" + source_folder + "/js/vendor/**.js")
    .pipe(concat("vendor.js"))
    .pipe(gulpif(isProd, uglify().on("error", notify.onError())))
    .pipe(dest("./" + project_folder + "/js/"));
  return src([
    "./" + source_folder + "/js/functions/**.js",
    "./" + source_folder + "/js/components/**.js",
    "./" + source_folder + "/js/main.js",
  ])
    .pipe(gulpif(!isProd, sourcemaps.init()))
    .pipe(
      babel({
        presets: ["@babel/env"],
      })
    )
    .pipe(concat("main.js"))
    .pipe(gulpif(isProd, uglify().on("error", notify.onError())))
    .pipe(gulpif(!isProd, sourcemaps.write(".")))
    .pipe(dest("./" + project_folder + "/js"))
    .pipe(browserSync.stream());
};

const scriptsBackend = () => {
  src("./" + source_folder + "/js/vendor/**.js")
    .pipe(concat("vendor.js"))
    .pipe(gulpif(isProd, uglify().on("error", notify.onError())))
    .pipe(dest("./" + project_folder + "/js/"));
  return src([
    "./" + source_folder + "/js/functions/**.js",
    "./" + source_folder + "/js/components/**.js",
    "./" + source_folder + "/js/main.js",
  ]).pipe(dest("./" + project_folder + "/js"));
};

const resources = () => {
  return src("./" + source_folder + "/resources/**").pipe(
    dest("./" + project_folder)
  );
};

const images = () => {
  return src([
    "./" + source_folder + "/img/**.jpg",
    "./" + source_folder + "/img/**.png",
    "./" + source_folder + "/img/**.jpeg",
    "./" + source_folder + "/img/*.svg",
    "./" + source_folder + "/img/**/*.jpg",
    "./" + source_folder + "/img/**/*.png",
    "./" + source_folder + "/img/**/*.jpeg",
  ])
    .pipe(
      webp({
        quality: 70,
      })
    )
    .pipe(
      imagemin({
        progressive: true,
        progressive: true,
        svgoPlugins: [{ removeViewBox: false }],
        interlaced: true,
        optimizationLevel: 3, // 0 to 7
      })
    )
    .pipe(gulpif(isProd, image()))
    .pipe(dest("./" + project_folder + "/img"));
};

const htmlInclude = () => {
  return src(["./" + source_folder + "/*.html"])
    .pipe(
      fileInclude({
        prefix: "@",
        basepath: "@file",
      })
    )
    .pipe(webphtml())
    .pipe(dest("./" + project_folder))
    .pipe(browserSync.stream());
};

const fonts = () => {
  return src("./" + source_folder + "/fonts/**.ttf")
    .pipe(ttf2woff2())
    .pipe(dest("./" + project_folder + "/fonts"));
};

const checkWeight = (fontname) => {
  let weight = 400;
  switch (true) {
    case /Thin/.test(fontname):
      weight = 100;
      break;
    case /ExtraLight/.test(fontname):
      weight = 200;
      break;
    case /Light/.test(fontname):
      weight = 300;
      break;
    case /Medium/.test(fontname):
      weight = 500;
      break;
    case /SemiBold/.test(fontname):
      weight = 600;
      break;
    case /Bold/.test(fontname):
      weight = 700;
      break;
    case /ExtraBold/.test(fontname):
      weight = 800;
      break;
    case /Heavy/.test(fontname):
      weight = 700;
      break;
    case /Black/.test(fontname):
      weight = 900;
      break;
    default:
      weight = 400;
  }
  return weight;
};

const cb = () => {};
let srcFonts = "./" + source_folder + "/scss/_fonts.scss";
let appFonts = "./" + project_folder + "/fonts/";

const fontsStyle = (done) => {
  let file_content = fs.readFileSync(srcFonts);
  fs.writeFile(srcFonts, "", cb);
  fs.readdir(appFonts, function (err, items) {
    if (items) {
      let c_fontname;
      for (let i = 0; i < items.length; i++) {
        let fontname = items[i].split(".");
        fontname = fontname[0];
        let font = fontname.split("-")[0];
        let weight = checkWeight(fontname);
        if (c_fontname != fontname) {
          fs.appendFile(
            srcFonts,
            '@include font-face("' +
              font +
              '", "' +
              fontname +
              '", ' +
              weight +
              ");\r\n",
            cb
          );
        }

        c_fontname = fontname;
      }
    }
  });
  done();
};

const watchFiles = () => {
  browserSync.init({
    server: {
      baseDir: "./" + project_folder,
    },
  });
  watch("./" + source_folder + "/scss/**/*.scss", styles);
  watch("./" + source_folder + "/js/**/*.js", scripts);
  watch("./" + source_folder + "/partials/*.html", htmlInclude);
  watch("./" + source_folder + "/*.html", htmlInclude);
  watch("./" + source_folder + "/img/*.{jpg,jpeg,png,svg}", images);
  watch("./" + source_folder + "/img/**/*.{jpg,jpeg,png}", images);
  watch("./" + source_folder + "/img/svg/**.svg", svgSprites);
  watch("./" + source_folder + "/resources/**", resources);
  watch("./" + source_folder + "/fonts/**", fonts);
  watch("./" + source_folder + "/fonts/**", fontsStyle);
};

const cache = () => {
  return src(project_folder + "/**/*.{css,js,svg,png,jpg,jpeg,woff2}", {
    base: project_folder,
  })
    .pipe(rev())
    .pipe(revDel())
    .pipe(dest(project_folder))
    .pipe(rev.manifest("rev.json"))
    .pipe(dest(project_folder));
};

const rewrite = () => {
  const manifest = readFileSync(project_folder + "/rev.json");
  src(project_folder + "/css/*.css")
    .pipe(
      revRewrite({
        manifest,
      })
    )
    .pipe(dest(project_folder + "/css"));
  return src(project_folder + "/**/*.html")
    .pipe(
      revRewrite({
        manifest,
      })
    )
    .pipe(dest(project_folder));
};

const htmlMinify = () => {
  return src(project_folder + "/**/*.html")
    .pipe(
      htmlmin({
        collapseWhitespace: true,
      })
    )
    .pipe(dest(project_folder));
};

const toProd = (done) => {
  isProd = true;
  done();
};

exports.default = series(
  clean,
  parallel(htmlInclude, scripts, fonts, resources, images, svgSprites),
  fontsStyle,
  styles,
  watchFiles
);

const scriptsBuild = () => {
  src("./" + source_folder + "/js/vendor/**.js")
    .pipe(concat("vendor.js"))
    .pipe(gulpif(isProd, uglify().on("error", notify.onError())))
    .pipe(dest("./" + project_folder + "/js/"));
  return src([
    "./" + source_folder + "/js/functions/**.js",
    "./" + source_folder + "/js/components/**.js",
    "./" + source_folder + "/js/main.js",
  ])
    .pipe(
      babel({
        presets: ["@babel/env"],
      })
    )
    .pipe(concat("main.js"))
    .pipe(gulpif(isProd, uglify().on("error", notify.onError())))
    .pipe(dest("./" + project_folder + "/js"));
};

const stylesBuild = () => {
  return src("./" + source_folder + "/scss/**/*.scss")
    .pipe(sass().on("error", notify.onError()))
    .pipe(
      autoprefixer({
        cascade: false,
      })
    )
    .pipe(gulpif(isProd, cleanCSS({ level: 2 })))
    .pipe(dest("./" + project_folder + "/css/"));
};

exports.default = series(
  clean,
  parallel(htmlInclude, scripts, fonts, resources, images, svgSprites),
  fontsStyle,
  styles,
  watchFiles
);

exports.build = series(
  toProd,
  clean,
  parallel(
    htmlInclude,
    scriptsBuild,
    fonts,
    resources,
    images,
    svgSprites,
    stylesBuild,
    svgSprites,
    htmlMinify,
    fontsStyle
  )
);

exports.cache = series(cache, rewrite);

exports.backend = series(
  toProd,
  clean,
  htmlInclude,
  scriptsBackend,
  stylesBackend,
  resources,
  images,
  svgSprites
);

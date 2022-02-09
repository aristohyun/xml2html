const fs = require("fs");
let filelist = [];

function getFiles(file, nowFolder) {
  if (file.isDirectory()) {
    nowFolder = nowFolder + "/" + file.name;
    let list = fs.readdirSync(nowFolder, { withFileTypes: true });
    list.forEach(function (file) {
      getFiles(file, nowFolder);
    });
  } else if (file.name.match(/\.xml/i)) {
    filelist.push(nowFolder + "/" + file.name);
  }
}

module.exports = {
  // 현재 디렉토리 이하의 모든 .xml파일의 주소를 가져오는 함수
  getFiles: function (nowFolder) {
    let list = fs.readdirSync(nowFolder, { withFileTypes: true });
    list.forEach(function (file) {
      getFiles(file, nowFolder);
    });
    return filelist;
  },
};

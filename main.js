const fs = require("fs"),
  get_xml = require("./modules/getXMLfiles"),
  xml2json = require("./modules/xml2json"),
  parser = require("./modules/json2html");

let files = get_xml.getFiles("."),
  log = "",
  i = 0,
  nums = 0,
  last = "";

for (i = 0; i < files.length; i++) {
  let route = files[i];
  if (i == 3000) break;

  let name = route.split("/");
  name = name[name.length - 1];

  try {
    // 텍스트를 읽어 온 후 html로 json으로 변환
    let xml = fs.readFileSync(route, "utf-8");
    xml = xml
      .slice(xml.indexOf("<body>"))
      .replace(/mml\:/g, "")
      .replace(
        /\<\/?list[a-zA-Z0-9ㄱ-힣 \-\_\=\'\"\[\]\{\}\(\)\,\.\/\~\!\@\#\$\%\^\&\*]*>/g,
        ""
      )
      .replace(/align\=\"center\"/gi, 'style="text-align:center"');

    // xml 텍스트를 json 으로 변환
    let jobj = xml2json.parse(xml);

    //body와 back을 나누어 파싱 후 합침
    let html = parser.body(jobj[0]);
    if (jobj.length == 2) html += parser.back(jobj[1]);

    !fs.existsSync("./html") && fs.mkdirSync("./html");

    fs.writeFile(
      "./html/" + name.replace(".xml", ".html"),
      html,
      function (err) {
        if (err) {
          log += route + " : " + err;
          return console.log(err);
        }
      }
    );
    nums++;
    last = files[i];
  } catch (e) {
    log += name + " : " + e + "\n";

    console.log("\n" + route);
    console.log(e);
    console.log("\n");
  }
}

if (i == 3000) {
  log += "\n\nlast converted file : " + last + "\n\n";
}

log += nums + " / " + i + " files converted\n";

fs.writeFile("./log.txt", log, function (err) {
  if (err) {
    return console.log(err);
  }
});

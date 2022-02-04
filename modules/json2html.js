const x2j = require("./xml2json"),
  m2l = require("mathml2latex");

/**
 * 태그와 텍스트 사이에 띄어쓰기를 체크하기 위함.
 * 앞단어와 첫단어를 비교하여 띄어쓰기 적용
 * preString + true/false + nextString
 */
function isBlank(prechar, nextchar = " ") {
  let blank_chars = [",", ".", "!", "?", ":", ";", ")", "]", "}", ">"],
    no_blank_chars = ["(", "[", "{", "<", ".", ","];

  if (
    blank_chars.includes(prechar) ||
    (prechar >= "a" && prechar <= "z") ||
    (prechar >= "A" && prechar <= "Z") ||
    (prechar >= "0" && prechar <= "9")
  ) {
    if (!blank_chars.includes(nextchar)) {
      return true;
    }
  }
  return false;
}

/**
 * mathML 태그 에서 textAlign을 가져오는 함수
 */
function getTextAlign(obj) {
  if (obj[":@"] != undefined && obj[":@"]["@_columnalign"] != undefined) {
    return obj[":@"]["@_columnalign"];
  }
  if (
    obj.semantics != undefined &&
    obj.semantics[0][":@"] != undefined &&
    obj.semantics[0][":@"]["@_columnalign"] != undefined
  ) {
    return obj.semantics[0][":@"]["@_columnalign"];
  }

  return "center";
}

/**
 * 일반적으로 p태그 내에서 폰트와 관련된 태그들 처리
 * 만일 sub, sup이라면 사용, 그외에는 태그 무시.
 */
function setFontTag(obj) {
  const used_keys = ["sub", "sup"];
  let text = "";

  Object.keys(obj).forEach(function (key) {
    if (key == ":@") return "";
    if (!used_keys.includes(key)) {
      text += " " + parseP(obj[key]);
    } else {
      text += "<" + key + ">" + parseP(obj[key]) + "</" + key + ">";
    }
  });
  return text;
}

/**
 * <preformat> 태그 변환을 진행합니다.
 */
function parsePreformat(string) {
  let text = "";

  string = string.replace(/^\s+|\s+$/g, "").replace(/\<\/?italic\>/g, "");
  string.split("\n").forEach(function (str) {
    let i = str.indexOf(str.match(/[^\s]/g)[0]),
      parse = x2j.parse("<p>" + str + "</p>");
    text += "<p>" + "&nbsp; ".repeat(i / 3) + parseP(parse[0].p) + "</p>\n";
  });
  return text;
}

/**
 * formula 변환을 진행합니다.
 * <span> 결과가 출력됩니다
 */

function parseFormula(math) {
  let latex = m2l
    .convert("<math>" + math.replace(/<mtd/g, "<mtd><mo>@@@@</mo>") + "</math>")
    .replace(/\\overset\{\^\}/g, "\\hat")
    .replace(/{\\sum *}_/g, "\\sum\\limits_")
    .replace(/@@@@/g, "&");

  return '<span class="math-tex">' + "\\(" + latex + "\\)" + "</span>";
}

/**
 * <disp-formula> 태그 변환
 * mathML을 위해 사용되는 태그입니다
 * 별도의 p태그를 가지며, 라벨이 없을 수도 있습니다
 */
function parseDispFormula(arr) {
  let label = "",
    latex = "",
    textalign = "center";

  for (let i = 0; i < arr.length; i++) {
    if (arr[i].hasOwnProperty("label")) {
      label = "&nbsp; &nbsp; &nbsp; &nbsp; " + arr[i]["label"][0]["#text"];
    } else if (arr[i].hasOwnProperty("math")) {
      let json = x2j.parse(arr[i]["math"][0]["#text"]);

      textalign = getTextAlign(json[0]);
      latex = parseFormula(arr[i]["math"][0]["#text"]);
    }
  }

  return '<p style="text-align:' + textalign + '">' + latex + label + "</p>";
}

/**
 * Fig 태그 변환 함수
 * label, caption, graphic 세가지 태그를 가지고 있으며,
 * 없을 수도 있음
 */
function parseFig(arr) {
  let label = "",
    caption = "",
    img = "";

  for (let i = 0; i < arr.length; i++) {
    if (arr[i].hasOwnProperty("label")) {
      label = parseP(arr[i].label);
    } else if (arr[i].hasOwnProperty("caption")) {
      caption = parseP(arr[i].caption).replace("<br/>\n", "");
    } else if (arr[i].hasOwnProperty("graphic")) {
      img = arr[i][":@"]["@_href"];
    }
  }

  return (
    '<p><img alt="' +
    img +
    ' 이미지" src=""/></p>\n' +
    "<p><strong>" +
    label +
    " " +
    caption +
    "</strong></p>\n\n"
  );
}

/**
 * Fig 태그 변환 함수
 * label, caption, table[graphic] 세가지 태그를 가지고 있으며,
 * 없을 수도 있음
 */
function parseTableWrap(arr) {
  let label = "",
    caption = "",
    table = "",
    img = "",
    foot = "";

  for (let i = 0; i < arr.length; i++) {
    if (arr[i].hasOwnProperty("label")) {
      label = parseP(arr[i].label);
    } else if (arr[i].hasOwnProperty("caption")) {
      caption = parseP(arr[i].caption).replace("<br/>\n", "");
    } else if (arr[i].hasOwnProperty("table")) {
      table =
        "<table>" +
        arr[i].table[0]["#text"].replace("graphic xlink:href", "img alt") +
        "</table>\n";
    } else if (arr[i].hasOwnProperty("graphic")) {
      img =
        '<p><img alt="' + arr[i][":@"]["@_href"] + ' 이미지" src=""/></p>\n';
    } else if (arr[i].hasOwnProperty("table-wrap-foot")) {
      foot +=
        "<p><strong>" +
        parseP(arr[i]["table-wrap-foot"]).replace("<br/>", "") +
        "</strong></p>";
    }
  }

  return (
    "<p><strong>" +
    label +
    " " +
    caption +
    "</strong></p>\n" +
    table +
    img +
    foot +
    "\n\n"
  );
}

/**
 * <p> 태그 변환을 진행합니다
 * <p> 태그는 가장 일반적인 태그이며, 안에 다양한 태그를 포함하고 있습니다.
 * 따라서 각 태그들이 등장할 때마다 그것에 맞는 변환을 진행해야 합니다
 * DOTO : whereA<sub>T</sub> is
 * ively.g<sub>T</sub>
 */
function parseP(arr) {
  let text = "",
    temp = "";

  if (arr === undefined) return;
  arr.forEach(function (obj) {
    Object.keys(obj).forEach(function (key) {
      switch (key) {
        case "p":
          text += " <br/>\n" + parseP(obj.p);
          return;
        case "preformat":
          text += parsePreformat(obj["preformat"][0]["#text"]);
          return;
        case "disp-quote":
          text +=
            '<p style="text-align:center">' +
            parseP(obj["disp-quote"]) +
            "</p>\n\n";
          return;
        case "disp-formula-group":
          obj["disp-formula-group"].forEach(function (formula) {
            text += parseDispFormula(formula["disp-formula"]);
          });
          return;
        case "disp-formula":
          text += parseDispFormula(obj["disp-formula"]);
          return;
        case "inline-formula":
          if (text.length != 0 && isBlank(text[text.length - 1])) {
            text += " ";
          }
          text += parseFormula(obj["inline-formula"][0]["math"][0]["#text"]);
          return;
        case "xref":
          if (text.length != 0 && isBlank(text[text.length - 1])) {
            text += " ";
          }
          if (obj[":@"]["@_ref-type"] == "bibr") {
            text +=
              '<a href="#ref-' +
              obj[":@"]["@_rid"].slice(1) +
              '">' +
              (obj["xref"].length == 0 ? "" : obj["xref"][0]["#text"]) +
              "</a>";
          } else {
            text += parseP(obj["xref"]);
          }
          return;
        case "graphic":
          text += '<img alt="' + obj[":@"]["@_href"] + ' 이미지" src=""/>';
          return;
        case "#text":
          if (
            text.length != 0 &&
            isBlank(text[text.length - 1], obj["#text"][0])
          ) {
            text += " ";
          }
          text += obj["#text"];
          return;
        case ":@":
          break;
        default:
          temp = setFontTag(obj);
          if (
            text.length != 0 &&
            !isBlank(text[text.length - 1]) &&
            temp[0] == " "
          ) {
            temp = temp.slice(1);
          }
          text += temp;
          return;
      }
    });
  });

  return text;
}

function getSectorText(arr, deep) {
  let text = "",
    temp = "";
  arr.forEach(function (obj) {
    Object.keys(obj).forEach(function (key) {
      switch (key) {
        case "sec":
          text += getSectorText(obj.sec, deep + 1);
          return;
        case "title":
          text +=
            "<h" + deep + ">" + parseP(obj.title) + "</h" + deep + ">\n\n";
          return;
        case "preformat":
          text += parsePreformat(obj["preformat"][0]["#text"]) + "\n";
          return;
        case "fig":
          text += parseFig(obj.fig);
          return;
        case "table-wrap":
          text += parseTableWrap(obj["table-wrap"]);
          return;
        case "disp-quote":
          text +=
            '<p style="text-align:center">' +
            parseP(obj["disp-quote"]) +
            "</p>\n\n";
          return;
        case "disp-formula-group":
          obj["disp-formula-group"].forEach(function (formula) {
            text += parseDispFormula(formula["disp-formula"]);
          });
          return;
        case "disp-formula":
          text += parseDispFormula(obj["disp-formula"]);
          return;
        case ":@":
          return;
        case "p":
        default:
          temp = parseP(obj[key]);
          let start = temp.indexOf("<p");
          if (start > 0) {
            temp =
              "<p>" + temp.slice(0, start) + "</p>\n\n" + temp.slice(start);
          }
          let end = temp.lastIndexOf("</p>");
          if (end != -1 && end + 4 != temp.length) {
            temp = temp.slice(0, end) + " " + temp.slice(end + 4) + "</p>";
          }
          if (start == end) temp = "<p>" + temp + "</p>";
          text += temp + "\n\n";
          return;
      }
    });
  });
  return text;
}

module.exports = {
  body: function (Obj) {
    let text = "";
    if (!Obj["body"][0].hasOwnProperty("sec")) {
      text += getSectorText(Obj["body"], 1);
    } else {
      Obj["body"].forEach(function (obj) {
        text += getSectorText(obj.sec, 1);
      });
    }
    return text;
  },

  back: function (Obj) {
    let text = "";
    Obj["back"].forEach(function (obj) {
      if (obj.hasOwnProperty("ref-list")) return;
      Object.keys(obj).forEach(function (key) {
        text += getSectorText(obj[key], 1);
      });
    });
    return text;
  },
};

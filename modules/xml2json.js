module.exports = {
  parse : function(xml) {
    const fxp = require("fast-xml-parser"),
      he = require("he"),
      options = {
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
        attrNodeName: "attr", //default is 'false'
        alwaysCreateTextNode: true,
        textNodeName: "#text",
        stopNodes: ["*.math", "*.table", "*.preformat", "*.ref-list"],
        commentPropName: "#comment",
        preserveOrder: true,
        removeNSPrefix: true,
      };
  
    const XMLParser = new fxp.XMLParser(options);
  
    return XMLParser.parse(xml);
  }
}
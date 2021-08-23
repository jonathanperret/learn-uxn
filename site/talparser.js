'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var language = require('@codemirror/language');
var highlight = require('@codemirror/highlight');
var lr = require('@lezer/lr');
var common = require('@lezer/common');

// This file was generated by lezer-generator. You probably shouldn't edit it.
const parser = lr.LRParser.deserialize({
  version: 13,
  states: "!WQYQPOOOhQPO'#CdOOQO'#Ci'#CiOOQO'#Ce'#CeQYQPOOOOQO,59O,59OOyQPO,59OOOQO-E6c-E6cOOQO1G.j1G.j",
  stateData: "![~O[OSPOS~ORQOSQOTQOVPO~ORQOSQOTQOUTOVPO~ORQOSQOTQOUWOVPO~O",
  goto: "u^PPPPPPPP_ePPPoXQOPSUQSOQUPTVSUXROPSU",
  nodeNames: "⚠ LineComment Program Identifier String Boolean ) ( Application",
  maxTerm: 13,
  nodeProps: [
    [common.NodeProp.openedBy, 6,"("],
    [common.NodeProp.closedBy, 7,")"]
  ],
  skippedNodes: [0,1],
  repeatNodeCount: 1,
  tokenData: "$d~R]XYzYZz]^zpqzrs!]st!zxy#Yyz#y}!O$O!Q![$O!c!}$O#R#S$O#T#o$O~!PS[~XYzYZz]^zpqz~!`TOr!]rs!os#O!]#O#P!t#P~!]~!tOS~~!wPO~!]~!}Q#Y#Z#T#h#i#T~#YOT~~#_RV~Oy#hyz#tz~#h~#kROy#hyz#tz~#h~#yOP~~$OOU~~$TTR~}!O$O!Q![$O!c!}$O#R#S$O#T#o$O",
  tokenizers: [0],
  topRules: {"Program":[0,2]},
  tokenPrec: 0
});

var TalLanguage = language.LRLanguage.define({
    parser: parser.configure({
        props: [
            language.indentNodeProp.add({
                Application: language.delimitedIndent({ closing: ')', align: false })
            }),
            language.foldNodeProp.add({
                Application: language.foldInside
            }),
            highlight.styleTags({
                Identifier: highlight.tags.variableName,
                Boolean: highlight.tags.bool,
                String: highlight.tags.string,
                LineComment: highlight.tags.lineComment,
                '( )': highlight.tags.paren
            }),
        ]
    }),
    languageData: {
        commentTokens: { line: ';' }
    }
});
function TAL() {
    return new language.LanguageSupport(TalLanguage);
}

exports.TAL = TAL;
exports.TalLanguage = TalLanguage;

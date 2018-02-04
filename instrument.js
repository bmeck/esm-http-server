'use strict';
const babel = require('babel-standalone');
const t = require('babel-types');
const transform = (referrer, meta) => {
  const prefix = `/redirect?referrer=${encodeURIComponent(referrer)}&specifier=`;
  return {
    visitor: {
      ExportDefaultDeclaration(path) {
        meta.hasDefault = true;
      },
      ExportSpecifier(path) {
        if (path.node.exported.name === 'default') {
          meta.hasDefault = true;
        }
      },
      ImportDeclaration(path) {
        const specifier = path.node.source.value;
        path.node.source = t.stringLiteral(
          `${prefix}${encodeURIComponent(specifier)}`
        );
        const ns_i = path.node.specifiers.findIndex(n => n.type === 'ImportNamespaceSpecifier');
        
        if (ns_i >= 0) {
          const ns = path.node.specifiers[ns_i];
          const node_i = path.parent.body.indexOf(path.node);
          if (path.node.specifiers.length === 1) {
            path.parent.body.splice(node_i, 1);
          } else {
            path.node.specifiers.splice(ns_i, 1);
          }
          path.parent.body.splice(
            node_i,
            0,
            t.importDeclaration(
              [
                t.importDefaultSpecifier(ns.local)
              ],
              t.stringLiteral(
                `${prefix}${encodeURIComponent(specifier)}&namespace`
              )
            )
          )
        }
      },
      Import(path) {
        path.parent.arguments[0] = t.templateLiteral(
          [
            t.templateElement({
              raw: prefix,
              cooked: prefix,
            }),
            t.templateElement({ raw: '&namespace', cooked: '&namespace' }, true),
          ],
          [
            t.callExpression(t.identifier('encodeURIComponent'), [
              path.parent.arguments[0],
            ]),
          ]
        );
      },
    },
  };
};
module.exports = (code, { referrer = '' } = {}) => {
  let meta = {
    hasDefault: false
  };
  // double parse because we don't know what this thing is
  try {
    return {
      code: babel.transform(code, {
        sourceType: 'module',
        plugins: [transform(referrer, meta)],
        parserOpts: {
          plugins: ['dynamicImport', 'importMeta'],
        },
      }).code,
      meta,
    };
  } catch (e) {
    console.error(e);
    return {
      code: babel.transform(code, {
        sourceType: 'script',
        plugins: [transform(referrer, meta)],
        parserOpts: {
          plugins: ['dynamicImport', 'importMeta'],
        },
      }).code,
      meta,
    };
  }
};
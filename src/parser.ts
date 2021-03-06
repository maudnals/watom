import { ItemType, TokenType } from './common/enums';
import { Token, AstItemExtended } from './common/types';
import { SEMICOLUMN } from './common/syntax';

// var ast = {
//   type: 'Program',
//   body: [
//     {
//       type: 'FunctionDeclaration',
//       name: 'add',
//       params: [
//         {
//           type: 'Numberi32',
//           value: 'a'
//         },
//         {
//           type: 'Numberi32',
//           value: 'b'
//         }
//       ],
//       returnValue: {
//         type: 'Expression',
//         value: {
//           type: 'Operation',
//           operator: '+',
//           operands: [
//             {
//               type: 'Numberi32',
//               value: 'a'
//             },
//             {
//               type: 'Numberi32',
//               value: 'b'
//             }
//           ]
//         }
//       }
//     }
//   ]
// };

// (module
//     (func (param $l i32) (param $r i32) (result i32)
//       get_local $l
//       get_local $r
//       i32.add)
//     ))

// (module
//   (func $add (param $l i32) (param $r i32) (result i32)
//     get_local $l
//     get_local $r
//     i32.add)
//   (export "add" (func $add))
// )

// $add
// (export "add" (func $add))

function opBuilder(tokens: Array<Token>, startIndex: number): AstItemExtended {
  // everything until the end of tokens is part of the op
  let endIndex = tokens.length - 1;
  const operandsTokens = tokens.slice(startIndex + 1, tokens.length);
  return {
    item: {
      type: ItemType.Operation,
      operator: tokens[startIndex].value,
      // +1 in order to ignore `=>`
      operands: operandsTokens.map(o => ({
        type: ItemType.Number,
        value: o.value
      }))
    },
    increment: endIndex - startIndex
  };
}

function returnValueBuilder(
  tokens: Array<Token>,
  startIndex: number
): AstItemExtended {
  let endIndex = startIndex;
  // everything between `=>` and `;` is part of the return value
  while (tokens[endIndex] && tokens[endIndex].value !== SEMICOLUMN) {
    endIndex++;
  }
  return {
    item: {
      type: ItemType.Expression,
      // +1 to ignore `=>`
      value: opBuilder(tokens, startIndex + 1).item
    },
    increment: endIndex - startIndex
  };
}

function fnDeclarationBuilder(
  tokens: Array<Token>,
  startIndex: number
): AstItemExtended {
  // a function declaration looks like: `fn fnName :`
  const endIndex = startIndex + 2;
  return {
    item: {
      name: tokens[startIndex + 1].value,
      type: ItemType.FnDeclaration
    },
    increment: endIndex - startIndex
  };
}

function paramsBuilder(
  tokens: Array<Token>,
  startIndex: number
): AstItemExtended {
  let endIndex = startIndex;
  // everything before `=>` is a parameter
  while (tokens[endIndex].value !== '=>') {
    endIndex++;
  }
  const params = tokens.slice(startIndex + 1, endIndex);
  return {
    item: params.map(p => ({
      type: ItemType.Number,
      value: p.value
    })),
    increment: endIndex - startIndex
  };
}

function parse(tokens: Array<Token>) {
  let current = 0;
  function getAstItem(token, tokens) {
    switch (token.type) {
      case TokenType.FnKeyword:
        let tempX = current;
        const fnDeclaration = fnDeclarationBuilder(tokens, tempX);
        let tempX2 = tempX + fnDeclaration.increment;
        const params = paramsBuilder(tokens, tempX2);
        let tempX3 = tempX2 + params.increment;
        const returnValue = returnValueBuilder(tokens, tempX3);
        let tempX4 = tempX3 + returnValue.increment;
        current += tempX4;
        return {
          ...fnDeclaration.item,
          params: params.item,
          returnValue: returnValue.item
        };
      default:
        current++;
        return {
          type: ItemType.Operation,
          value: token.value
        };
    }
  }
  const ast = {
    type: ItemType.Program,
    body: []
  };
  while (current < tokens.length) {
    ast.body.push(getAstItem(tokens[current], tokens));
  }
  return ast;
}

export default parse;

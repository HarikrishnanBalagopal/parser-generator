const productionTreeString = "{\"S'\":[{\"pl\":\"S'\",\"pr\":[\"Statements\"]}],\"Statements\":[{\"pl\":\"Statements\",\"pr\":[\"Statement\",\"Statements\"]},{\"pl\":\"Statements\",\"pr\":[]}],\"Statement\":[{\"pl\":\"Statement\",\"pr\":[\"(\",\"identifier\",\"Parameters\",\")\"]}],\"Parameters\":[{\"pl\":\"Parameters\",\"pr\":[\"Parameter\",\"Parameters\"]},{\"pl\":\"Parameters\",\"pr\":[]}],\"Parameter\":[{\"pl\":\"Parameter\",\"pr\":[\"Statement\"]},{\"pl\":\"Parameter\",\"pr\":[\"identifier\"]},{\"pl\":\"Parameter\",\"pr\":[\"number\"]},{\"pl\":\"Parameter\",\"pr\":[\"string\"]}]}";
const productionsArrayString = "[{\"pl\":\"S'\",\"pr\":[\"Statements\"]},{\"pl\":\"Statements\",\"pr\":[\"Statement\",\"Statements\"]},{\"pl\":\"Statements\",\"pr\":[]},{\"pl\":\"Statement\",\"pr\":[\"(\",\"identifier\",\"Parameters\",\")\"]},{\"pl\":\"Parameters\",\"pr\":[\"Parameter\",\"Parameters\"]},{\"pl\":\"Parameters\",\"pr\":[]},{\"pl\":\"Parameter\",\"pr\":[\"Statement\"]},{\"pl\":\"Parameter\",\"pr\":[\"identifier\"]},{\"pl\":\"Parameter\",\"pr\":[\"number\"]},{\"pl\":\"Parameter\",\"pr\":[\"string\"]}]";
const code = "(add 1 1)";

function testLR1()
{
  console.log('testing LR1 computeLR1States');

  const productionTree = JSON.parse(productionTreeString);
  const productionsArray = JSON.parse(productionsArrayString);

  const states = computeLR1States(productionTree);

  console.log("States:");
  console.log(states);

  const table = generateLR1Table({states, productionsArray});

  console.log("Table:");
  console.log(table);

  const tokens = lexer(code);

  console.log("Tokens:");
  console.log(tokens);

	const prods = productionsArray.map(prod => ({ left: prod.pl, right: prod.pr.length }));
  const ast = lrParser(tokens, table, prods);

  console.log("Ast:");
  console.log(ast);
}

testLR1();
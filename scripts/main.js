var data = {};

function select(s) {
  return document.querySelector(s);
}

function init(d) {
  d.productions = select("#prods");
  d.code = select("#code");
  d.console = select("#console");
  d.go = select("#go");
  d.go2 = select("#go2");
  d.go3 = select("#go3");
  d.go4 = select("#go4");
  d.go5 = select("#go5");
  d.clear = select("#clear");
  d.reset = select("#reset");
  d.cout = v => {
    if (typeof v !== "string") v = JSON.stringify(v);
    d.console.value += v + "\n";
  };
  d.cout1 = console.log;
  d.go.addEventListener("click", () => go(d));
  d.go2.addEventListener("click", () => go2(d));
  d.go3.addEventListener("click", () => go3(d));
  d.go4.addEventListener("click", () => go4(d));
  d.go5.addEventListener("click", () => go5(d));
  d.clear.addEventListener("click", () => (d.console.value = ""));
  d.reset.addEventListener("click", () => reset(d));
  d.nitem = (p, l) => ({ prod: p, dot: 0, la: l });
  reset(d);
}

function reset(d) {
  d.cout("RESETTING");
  d.console.value = "";
  d.firsts = {};
  d.follows = { "S'": ["$"] };
  d.mod_firsts = {};
  d.mod_follows = { "S'": ["$"] };
  d.states = [];
  d.stack = [];
  d.new_sn = 1;
  d.table = {};
  d.symbol_table = {};
}

function go(d) {
  //d.cout("GO!");
  var input = d.productions.value;
  var prods = {};
  var lines = input.split("\n").filter(line => line !== "");
  //d.cout(lines);
  var words = lines.map(line => line.split(" ").filter(word => word !== ""));
  d.cout(words);
  d.cout("-------------------------------------------");
  words.map(line => {
    if(line.length < 1)return;
    var variable = line.shift();
    var currps = [], currp = [];
    line.shift();
    while (line.length > 0)
    {
      var token = line.shift();
      if (token === "|")
      {
        currps.push(currp);
        currp = [];
        continue;
      }
      if(token !== "epsilon")currp.push(token);
    }
    currps.push(currp);
    prods[variable] = currps;
  });
  console.log(prods);
  d.cout(prods);
  var prod_arr = [];
  var prod_tree = {};
  Object.keys(prods).map(key => {
    prods[key].map(prod => {
      var p = { pl: key, pr: prod };
      if (prod_tree[key] === undefined) prod_tree[key] = [];
      prod_tree[key].push(p);
      prod_arr.push(p);
    });
  });
  d.prod_tree = prod_tree;
  d.prods = prod_arr;
  console.log(prod_tree);
  console.log(prod_arr);
  d.cout("-------------------------------------------");
  d.cout(prod_tree);
  d.cout("-------------------------------------------");
  d.cout(prod_arr);
}

function go2(d) {
  if (d.prods === undefined) return;
  var curr_state = { sn: 0, items: [], transitions: {} };
  var items_to_add = [d.nitem(d.prods[0], ["$"])];
  var items_added = add_if_not_present(d, curr_state, items_to_add);
  while (items_added.length > 0) {
    items_to_add = close_items(d, items_added);
    items_added = add_if_not_present(d, curr_state, items_to_add);
  }
  d.states.push(curr_state);
  d.stack.push(curr_state);
  while (d.stack.length > 0) {
    curr_state = d.stack.pop();
    var transitions = find_transitions(curr_state);
    Object.keys(transitions).map(transition => {
      items_added = transitions[transition];
      var new_state = { sn: d.new_sn, items: items_added, transitions: {} };
      while (items_added.length > 0) {
        items_to_add = close_items(d, items_added);
        items_added = add_if_not_present(d, new_state, items_to_add);
      }
      var result = d.states.find(state => compare_item_arr(state.items, new_state.items));
      if (result === undefined) {
        d.states.push(new_state);
        d.stack.push(new_state);
        curr_state.transitions[transition] = new_state;
        d.new_sn++;
        return;
      }
      curr_state.transitions[transition] = result;
    });
  }
  d.cout(d.states.map(state_to_str).join("\n----------------\n"));
  d.cout1("States:");
  d.cout1(d.states);
}

function go3(d) {
  d.states.map(state => {
    d.table[state.sn] = {};
    Object.keys(state.transitions).map(transition => {
      var prefix = "S";
      if (/[A-Z]/.test(transition)) prefix = "";
      insert_table(d.table, state.sn, transition, prefix + state.transitions[transition].sn);
    });
    state.items.map(item => {
      if (item.dot !== item.prod.pr.length) return;
      var idx = d.prods.indexOf(item.prod);
      item.la.map(l => insert_table(d.table, state.sn, l, "R" + idx));
    });
  });
  d.cout(d.table);
  d.cout1("Table:");
  d.cout1(d.table);
}

function go4(d) {
  var tokens = lexer(d.code.value);
  d.cout("Tokens:");
  d.cout(tokens);
  var prods = d.prods.map(prod => {
    return { left: prod.pl, right: prod.pr.length };
  });
  d.ast = lr_parser(tokens, d.table, prods);
  d.cout("Ast:");
  d.cout(d.ast);
  d.cout1(d.ast);
}

function go5(d) {
  var ast = d.ast;
  d.cout("Type Check:");
  d.cout(type_check(d, ast, "S'"));
}

function type_check(d, ast, expected_type) {
  var func_types = {
    add: { output: "number", input: ["number", "number"] },
    sub: { output: "number", input: ["number", "number"] },
    mul: { output: "number", input: ["number", "number"] },
    div: { output: "number", input: ["number", "number"] },
    "=": { output: "action", input: ["number", "number"] },
    defvar: { output: "action", input: ["identifier", "any"] },
    print: { output: "action", input: ["number"] }
  };
  if (expected_type === "any") return true;
  switch (ast.type) {
    case "Statements":
      if (ast.sub.length === 0) return true;
      var result = type_check(d, ast.sub[0], "action");
      if (!result) {
        d.cout("Type Error");
        return false;
      }
      return type_check(d, ast.sub[1], "Statements");
    case "Statement":
      var func_id = ast.sub[1];
      var ftype = func_types[func_id.value];
      if (ftype === undefined) return true;
      if (expected_type !== ftype.output) {
        d.cout("return type of function " + func_id.value + " is " + ftype.output + ", expected " + expected_type);
        return false;
      }
      var result = type_check_params(d, ast.sub[2], ftype.input.slice());
      if (!result) d.cout("at Parameters for " + func_id.value);
      return result;

    case "Parameter":
      return type_check(d, ast.sub[0], expected_type);

    case "identifier":
      var id_type = d.symbol_table[ast.value];
      if (id_type === undefined && func_types[ast.value] !== undefined) id_type = func_types[ast.value].output;
      if (id_type !== undefined) {
        var result = id_type === expected_type;
        if (!result) d.cout("Identifier " + ast.value + " has type " + id_type + ", expected " + expected_type);
        return result;
      }
      d.symbol_table[ast.value] = expected_type;
      return true;

    case "number":
    case "string":
      var result = expected_type === ast.type;
      if (!result) d.cout("actual " + ast.type + ", expected " + expected_type);
      return result;
  }
  return false;
}

function type_check_params(d, ast, ptypes) {
  if (ast.type !== "Parameters") return false;
  if (ast.sub.length === 0) return ptypes.length === 0;
  if (ptypes.length === 0) return false;
  var result = type_check(d, ast.sub[0], ptypes.pop());
  return result && type_check_params(d, ast.sub[1], ptypes);
}

function insert_table(table, y, x, e) {
  if (table[y][x] !== undefined) {
    alert("S/R conflict on " + x + ", " + y + ", " + e);
    return;
  }
  if (e == "R0") e = "accept";
  table[y][x] = e;
}
function find_transitions(state) {
  var transitions = {};
  state.items.map(item => {
    if (item.dot === item.prod.pr.length) return;
    var token = item.prod.pr[item.dot];
    if (transitions[token] === undefined) transitions[token] = [];
    transitions[token].push(advance_item(item));
  });
  return transitions;
}

function advance_item(item) {
  return { prod: item.prod, dot: item.dot + 1, la: item.la };
}

function compare_item_arr(is1, is2) {
  if (is1.length !== is2.length) return false;
  return is1.every((i1, idx) => compare_items(i1, is2[idx]));
}

function close_items(d, items) {
  return items
    .map(item => {
      if (item.dot >= item.prod.pr.length) return; //final item
      var token = item.prod.pr[item.dot]; //token to close
      if (!/[A-Z]/.test(token[0])) return; //token is a terminal
      var curr_ps = d.prod_tree[token]; //prods for the non terminal
      var curr_la = [];
      if (item.dot === item.prod.pr.length - 1) curr_la = item.la.slice();
      else {
        var pr = item.prod.pr;
        var idx = item.dot + 1;
        var empty = true;
        while (empty && idx < pr.length) {
          empty = false;
          mod_first(d, pr[idx++]).map(f => {
            if (f === "epsilon") {
              empty = true;
              return;
            }
            add_to_arr_if_not_present(curr_la, f);
          });
        }
        if (empty) item.la.map(l => add_to_arr_if_not_present(curr_la, l));
      }
      return curr_ps.map(prod => d.nitem(prod, curr_la));
    })
    .filter(is => is !== undefined)
    .reduce((arr, is) => arr.concat(is), []);
}

function add_if_not_present(d, state, items) {
  var items_added = [];
  items.map(item => {
    if (state.items.every(exist_i => !compare_items(exist_i, item))) {
      state.items.push(item);
      items_added.push(item);
    }
  });
  return items_added;
}

function mod_first(d, token) {
  if (!/[A-Z]/.test(token)) return [token]; //terminal
  if (d.mod_firsts[token] !== undefined) return d.mod_firsts[token];
  d.mod_firsts[token] = [];
  var prods = d.prod_tree[token];
  prods.map(prod => {
    if (prod.pr.length === 0) {
      add_to_arr_if_not_present(d.mod_firsts[token], "epsilon");
      return;
    }
    first(d, prod.pr[0]).map(f => add_to_arr_if_not_present(d.mod_firsts[token], f));
  });
  return d.mod_firsts[token];
}

function first(d, token) {
  if (!/[A-Z]/.test(token)) return [token]; //terminal
  if (d.firsts[token] !== undefined) return d.firsts[token];
  d.firsts[token] = [];
  var prods = d.prod_tree[token];
  prods.map(prod => {
    if (prod.pr.length === 0) {
      follow(d, prod.pl).map(f => add_to_arr_if_not_present(d.firsts[token], f));
      return;
    }
    first(d, prod.pr[0]).map(f => add_to_arr_if_not_present(d.firsts[token], f));
  });
  return d.firsts[token];
}

function follow(d, token) {
  if (d.follows[token] !== undefined) return d.follows[token];
  d.follows[token] = [];
  d.prods.map(prod => {
    elem_indices(prod.pr, token).map(idx => {
      if (idx >= prod.pr.length - 1) {
        follow(d, prod.pl).map(f => add_to_arr_if_not_present(d.follows[token], f));
        return;
      }
      first(d, prod.pr[idx + 1]).map(f => add_to_arr_if_not_present(d.follows[token], f));
    });
  });
  return d.follows[token];
}

function elem_indices(arr, str) {
  var indices = [];
  arr.map((s, i) => {
    if (s === str) indices.push(i);
  });
  return indices;
}

function add_to_arr_if_not_present(arr, token) {
  if (arr.every(str => str !== token)) arr.push(token);
}

function compare_items(i1, i2) {
  return i1.dot === i2.dot && compare_arr_str(i1.la, i2.la) && compare_prods(i1.prod, i2.prod);
}

function compare_prods(p1, p2) {
  return p1.pl === p2.pl && compare_arr_str(p1.pr, p2.pr);
}

function compare_arr_str(a1, a2) {
  if (a1.length !== a2.length) return false;
  return a1.every((s1, i) => s1 === a2[i]);
}

function state_to_str(state) {
  var str = "State " + state.sn + ":";
  state.items.map(item => {
    str += "\n";
    var prod = item.prod,
      i = 0;
    str += prod.pl + " ->";
    for (; i < item.dot; i++) str += " " + prod.pr[i];
    str += " .";
    for (; i < prod.pr.length; i++) str += " " + prod.pr[i];
    str += " ,";
    item.la.map(l => (str += " " + l));
  });
  str += "\nTransitions:\n";
  Object.keys(state.transitions).map(transition => {
    str += transition + ":" + state.transitions[transition].sn + " ";
  });
  return str;
}

function lexer(s) {
  var tokens = [];
  var i = 0;
  while (i < s.length) {
    ch = s[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (/[()]/.test(ch)) {
      tokens.push({ type: ch, value: ch });
      i++;
      continue;
    }
    if (/[a-z+\-_*=<>?!]/.test(ch)) {
      var token = "";
      do {
        token += s[i];
        i++;
      } while (i < s.length && /[a-z0-9+\-_*=<>?!]/.test(s[i]));
      tokens.push({ type: "identifier", value: token });
      continue;
    }
    if (/[0-9]/.test(ch)) {
      var token = "";
      do {
        token += s[i];
        i++;
      } while (i < s.length && /[0-9.]/.test(s[i]));
      tokens.push({ type: "number", value: parseFloat(token) });
      continue;
    }
    if (ch === '"') {
      var token = "";
      while (++i < s.length && s[i] !== '"') token += s[i];
      tokens.push({ type: "string", value: token });
      i++;
      continue;
    }
    i++;
  }
  tokens.push({ type: "$", value: "$" });
  return tokens;
}

function lr_parser(tokens, table, prods) {
  var tree = {};
  var stack = [{ s: "0", ptr: tree }];
  var i = 0;
  while (i < tokens.length && stack.length > 0) {
    var token = tokens[i];
    var state = stack[stack.length - 1];
    var row = table[state.s];
    if (!row) {
      alert("Error: No row for state " + state.s + " in table");
      return tree;
    }
    var entry = row[token.type];
    if (!entry) {
      alert("Error: No entry for token " + token.type + " in row " + state.s);
      return tree;
    }
    if (entry === "accept") {
      stack.pop();
      return stack.pop().ptr;
    }
    if (entry[0] === "S") {
      var node = { type: token.type, value: token.value, sub: [] };
      stack.push({ s: token.type, ptr: node });
      stack.push({ s: entry.slice(1) });
      i++;
      continue;
    }
    if (entry[0] === "R") {
      var prod = prods[entry.slice(1)];
      if (!prod) {
        alert("No production of index " + entry[1]);
        console.log("Token:", token, "\nState:", state);
        return tree;
      }
      var node = { type: prod.left, sub: [] };
      for (var j = 0; j < prod.right; j++) {
        stack.pop();
        node.sub.unshift(stack.pop().ptr);
      }
      state = stack[stack.length - 1];
      row = table[state.s];
      entry = row[prod.left];
      stack.push({ s: prod.left, ptr: node });
      stack.push({ s: entry });
      continue;
    }
    alert("Error in table entry " + entry + " for row " + state.s + " for token " + token.type);
    return tree;
  }
}

init(data);

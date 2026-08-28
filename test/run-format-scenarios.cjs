/**
 * run-format-scenarios.js — Run all formatting scenarios and report results.
 */
const { findTemplateRegions } = require("../dist/template/detector.js");
const { formatTemplateInner } = require("../dist/formatting/printer.js");

function formatTemplate(source, indentChar = "  ") {
  const regions = findTemplateRegions(source);
  let result = source;
  let offset = 0;

  for (const region of regions) {
    if (regions.some(o => o !== region && region.innerStart >= o.innerStart && region.innerEnd <= o.innerEnd)) continue;
    const formatted = formatTemplateInner(region.inner, region.baseIndent, indentChar);
    if (formatted === region.inner) continue;
    const start = region.innerStart + offset;
    const end = region.innerEnd + offset;
    result = result.slice(0, start) + formatted + result.slice(end);
    offset += formatted.length - (end - start);
  }

  return result;
}

const scenarios = [
  // 1. Simple function component
  {
    name: "simple function component",
    input: `function Counter() {
  const count = signal(0);
  return html\`
    <div>
      <p>\${() => count.value}</p>
      <button @click=\${() => count.value++}>+</button>
    </div>
  \`;
}`,
    expected: `function Counter() {
  const count = signal(0);
  return html\`
    <div>
      <p>\${() => count.value}</p>
      <button @click=\${() => count.value++}>+</button>
    </div>
  \`;
}`,
  },

  // 2. Class component with lifecycle (single-line template stays inline)
  {
    name: "class component with lifecycle",
    input: `class Timer extends ElurComponent {
  count = signal(0);
  onMount() {
    this._id = setInterval(() => this.count.update(n => n + 1), 1000);
    return () => clearInterval(this._id);
  }
  render() {
    return html\`<span>\${() => this.count.value}s</span>\`;
  }
}`,
    expected: `class Timer extends ElurComponent {
  count = signal(0);
  onMount() {
    this._id = setInterval(() => this.count.update(n => n + 1), 1000);
    return () => clearInterval(this._id);
  }
  render() {
    return html\`<span>\${() => this.count.value}s</span>\`;
  }
}`,
  },

  // 3. setChildren chained in template
  {
    name: "setChildren chained in template",
    input: `const app = html\`
  <div>
    \${new Card().setChildren(html\`<p>Hello from inside the card</p>\`)}
  </div>
\`;`,
    expected: `const app = html\`
  <div>
    \${new Card().setChildren(html\`<p>Hello from inside the card</p>\`)}
  </div>
\`;`,
  },

  // 4. Named slots with setSlot + setChildren
  {
    name: "named slots with setSlot + setChildren",
    input: `const page = html\`
  <div class="layout">
    \${new PageLayout()
      .setSlot("header", html\`<h1>My App</h1>\`)
      .setChildren(html\`<p>Main content goes here.</p>\`)
      .setSlot("footer", html\`<small>© 2026</small>\`)}
  </div>
\`;`,
    expected: `const page = html\`
  <div class="layout">
    \${new PageLayout()
      .setSlot("header", html\`<h1>My App</h1>\`)
      .setChildren(html\`<p>Main content goes here.</p>\`)
      .setSlot("footer", html\`<small>© 2026</small>\`)}
  </div>
\`;`,
  },

  // 5. Function component with props
  {
    name: "function component with props",
    input: `const app = html\`
  <div>
    \${Card({ children: html\`<p>Card content</p>\` })}
  </div>
\`;`,
    expected: `const app = html\`
  <div>
    \${Card({ children: html\`<p>Card content</p>\` })}
  </div>
\`;`,
  },

  // 6. Nested class components
  {
    name: "nested class components",
    input: `class ThemeProvider extends ElurComponent {
  render() {
    return html\`
      <div>
        \${new ThemedButton()}
      </div>
    \`;
  }
}`,
    expected: `class ThemeProvider extends ElurComponent {
  render() {
    return html\`
      <div>\${new ThemedButton()}</div>
    \`;
  }
}`,
  },

  // 7. repeat() list rendering
  {
    name: "repeat() list rendering",
    input: `function TodoList() {
  const todos = signal([]);
  return html\`
    <ul>
      \${() => repeat(
        todos.value,
        (t) => t.id,
        (t) => html\`<li>\${t.text}</li>\`,
      )}
    </ul>
  \`;
}`,
    expected: `function TodoList() {
  const todos = signal([]);
  return html\`
    <ul>
      \${() => repeat(
        todos.value,
        (t) => t.id,
        (t) => html\`<li>\${t.text}</li>\`,
      )}
    </ul>
  \`;
}`,
  },

  // 8. Event modifiers
  {
    name: "event modifiers",
    input: `html\`
  <form @submit.prevent=\${() => save()}>
    <input @input.stop=\${(e) => update(e.target.value)} />
    <button @click.prevent.stop=\${() => cancel()}>Cancel</button>
  </form>
\`;`,
    expected: `html\`
  <form @submit.prevent=\${() => save()}>
    <input @input.stop=\${(e) => update(e.target.value)} />
    <button @click.prevent.stop=\${() => cancel()}>Cancel</button>
  </form>
\`;`,
  },

  // 9. Mixed HTML + components + expressions
  {
    name: "mixed HTML + components + expressions",
    input: `function App() {
  const user = signal(null);
  return html\`
    <div class="app">
      <header>
        <h1>My App</h1>
        \${new Navbar()}
      </header>
      <main>
        \${() => user.value ? html\`<p>Welcome \${user.value.name}</p>\` : html\`<p>Please log in</p>\`}
      </main>
      \${new Footer().setChildren(html\`<small>© 2026</small>\`)}
    </div>
  \`;
}`,
    expected: `function App() {
  const user = signal(null);
  return html\`
    <div class="app">
      <header>
        <h1>My App</h1>
        \${new Navbar()}
      </header>
      <main>
        \${() => user.value ? html\`<p>Welcome \${user.value.name}</p>\` : html\`<p>Please log in</p>\`}
      </main>
      \${new Footer().setChildren(html\`<small>© 2026</small>\`)}
    </div>
  \`;
}`,
  },

  // 10. Complex nested template (from real landing page)
  {
    name: "complex nested template (real landing)",
    input: `function CounterDemo() {
  const count = signal(0);
  const doubled = computed(() => count.value * 2);
  return html\`
    <div class="playground-output">
      <div class="playground-output-label">Output</div>
      <div class="demo-counter-value">\${() => count.value}</div>
      <div class="demo-computed-value">
        doubled: <span>\${() => doubled.value}</span> ·
        <span style=\${() => \`color: \${labelColor.value}\`}>\${() => label.value}</span>
      </div>
      <div class="demo-buttons">
        <button class="demo-btn demo-btn-secondary" @click=\${() => (count.value -= 1)}>− 1</button>
        <button class="demo-btn demo-btn-primary" @click=\${() => (count.value += 1)}>+ 1</button>
        <button class="demo-btn demo-btn-danger" @click=\${() => (count.value = 0)}>Reset</button>
      </div>
    </div>
  \`;
}`,
    expected: `function CounterDemo() {
  const count = signal(0);
  const doubled = computed(() => count.value * 2);
  return html\`
    <div class="playground-output">
      <div class="playground-output-label">Output</div>
      <div class="demo-counter-value">\${() => count.value}</div>
      <div class="demo-computed-value">
        doubled: <span>\${() => doubled.value}</span> ·
        <span style=\${() => \`color: \${labelColor.value}\`}>\${() => label.value}</span>
      </div>
      <div class="demo-buttons">
        <button class="demo-btn demo-btn-secondary" @click=\${() => (count.value -= 1)}>− 1</button>
        <button class="demo-btn demo-btn-primary" @click=\${() => (count.value += 1)}>+ 1</button>
        <button class="demo-btn demo-btn-danger" @click=\${() => (count.value = 0)}>Reset</button>
      </div>
    </div>
  \`;
}`,
  },

  // 11. Deeply nested HTML structure
  {
    name: "deeply nested HTML",
    input: `html\`
  <div class="container">
    <div class="row">
      <div class="col">
        <h2>Title</h2>
        <p>Paragraph text</p>
      </div>
      <div class="col">
        <img src="/img.png" alt="Image" />
      </div>
    </div>
  </div>
\`;`,
    expected: `html\`
  <div class="container">
    <div class="row">
      <div class="col">
        <h2>Title</h2>
        <p>Paragraph text</p>
      </div>
      <div class="col">
        <img src="/img.png" alt="Image" />
      </div>
    </div>
  </div>
\`;`,
  },

  // 12. Multi-line expression (block expr)
  {
    name: "multi-line expression in template",
    input: `html\`
  <div>
    \${() => {
      if (loading.value) return html\`<p>Loading...</p>\`;
      if (error.value) return html\`<p>Error!</p>\`;
      return html\`<p>\${data.value}</p>\`;
    }}
  </div>
\`;`,
    expected: `html\`
  <div>
    \${() => {
      if (loading.value) return html\`<p>Loading...</p>\`;
      if (error.value) return html\`<p>Error!</p>\`;
      return html\`<p>\${data.value}</p>\`;
    }}
  </div>
\`;`,
  },

  // 13. Array of components
  {
    name: "array of components",
    input: `html\`
  <div>
    \${[
      html\`<span>A</span>\`,
      html\`<span>B</span>\`,
      new Inner(),
    ]}
  </div>
\`;`,
    expected: `html\`
  <div>
    \${[
      html\`<span>A</span>\`,
      html\`<span>B</span>\`,
      new Inner(),
    ]}
  </div>
\`;`,
  },

  // 14. Long attribute that needs wrapping
  {
    name: "long attributes wrapping",
    input: `html\`
  <button class="demo-btn demo-btn-secondary demo-btn-large demo-btn-rounded" @click=\${() => doSomething()}>
    Click
  </button>
\`;`,
    expected: `html\`
  <button
    class="demo-btn demo-btn-secondary demo-btn-large demo-btn-rounded"
    @click=\${() => doSomething()}
  >
    Click
  </button>
\`;`,
  },

  // 15. Empty template
  {
    name: "empty template",
    input: `html\`\``,
    expected: `html\`\``,
  },

  // 16. Text only template
  {
    name: "text only template",
    input: `html\`Hello world\``,
    expected: `html\`Hello world\``,
  },

  // 17. Conditional rendering with ternary
  {
    name: "conditional rendering",
    input: `html\`
  <div>
    \${() => show.value ? html\`<span>visible</span>\` : null}
  </div>
\`;`,
    expected: `html\`
  <div>
    \${() => show.value ? html\`<span>visible</span>\` : null}
  </div>
\`;`,
  },

  // 18. Self-closing void elements
  {
    name: "void elements",
    input: `html\`
  <div>
    <br />
    <img src="/img.png" alt="Image" />
    <input type="text" value=\${() => val.value} />
  </div>
\`;`,
    expected: `html\`
  <div>
    <br />
    <img src="/img.png" alt="Image" />
    <input type="text" value=\${() => val.value} />
  </div>
\`;`,
  },

  // 19. Comments in template
  {
    name: "HTML comments",
    input: `html\`
  <div>
    <!-- This is a comment -->
    <p>Content</p>
  </div>
\`;`,
    expected: `html\`
  <div>
    <!-- This is a comment -->
    <p>Content</p>
  </div>
\`;`,
  },

  // 20. Inline style binding with nested template literal
  {
    name: "inline style binding with nested template literal",
    input: `html\`
  <div>
    <span style=\${() => \`color: \${color.value}; font-weight: \${weight.value}\`}>
      \${() => label.value}
    </span>
  </div>
\`;`,
    expected: `html\`
  <div>
    <span style=\${() => \`color: \${color.value}; font-weight: \${weight.value}\`}>
      \${() => label.value}
    </span>
  </div>
\`;`,
  },

  // 21. Unformatted input that NEEDS formatting
  {
    name: "unformatted → formatted (the real test)",
    input: `function Counter() {
  const count = signal(0);
  return html\`<div><p>\${() => count.value}</p><button @click=\${() => count.value++}>+</button></div>\`;
}`,
    expected: `function Counter() {
  const count = signal(0);
  return html\`
    <div>
      <p>\${() => count.value}</p>
      <button @click=\${() => count.value++}>+</button>
    </div>
  \`;
}`,
  },

  // 22. Badly indented input → properly indented output
  {
    name: "bad indentation → fixed",
    input: `html\`<div><span>hello</span><span>world</span></div>\``,
    expected: `html\`
  <div>
    <span>hello</span>
    <span>world</span>
  </div>
\``,
  },

  // 23. Real TodoDemo from landing (complex)
  {
    name: "real TodoDemo (complex multi-line exprs)",
    input: `function TodoDemo() {
  const todos = signal([]);
  return html\`
        <div class="playground-output">
            <div class="playground-output-label">Output</div>
        <div class="demo-todo-input-row">
            <input class="demo-todo-input" type="text" placeholder="Add a task..." value=\${() => inputValue.value} @input=\${(e) => { inputValue.value = e.target.value; }} @keydown=\${(e) => { if (e.key === "Enter") addTodo(); }} />
            <button class="demo-btn demo-btn-primary" @click=\${addTodo}>Add</button>
        </div>
        <ul class="demo-todo-list">
            \${() => repeat(todos.value, (t) => t.id, (t) => html\`<li class=\${() => \`demo-todo-item\${t.done.value ? " done" : ""}\`}><span>\${t.text}</span><button @click=\${() => toggleTodo(t.id)}>\${() => (t.done.value ? "↩" : "✓")}</button></li>\`)}
        </ul>
        </div>
    \`;
}`,
    expected: null, // We'll check this manually
  },
];

// Run scenarios
let passed = 0;
let failed = 0;
const failures = [];

for (const s of scenarios) {
  const result = formatTemplate(s.input);
  if (s.expected === null) {
    // Manual check — just print
    console.log(`\n=== ${s.name} (manual) ===`);
    console.log(result);
    continue;
  }
  if (result === s.expected) {
    passed++;
    console.log(`✓ ${s.name}`);
  } else {
    failed++;
    failures.push(s.name);
    console.log(`✗ ${s.name}`);
    console.log("--- Expected ---");
    console.log(s.expected);
    console.log("--- Got ---");
    console.log(result);
    console.log("--- Diff ---");
    const expLines = s.expected.split("\n");
    const gotLines = result.split("\n");
    const maxLen = Math.max(expLines.length, gotLines.length);
    for (let i = 0; i < maxLen; i++) {
      const e = expLines[i] || "";
      const g = gotLines[i] || "";
      if (e !== g) {
        console.log(`  L${i + 1}: exp: ${JSON.stringify(e)}`);
        console.log(`  L${i + 1}: got: ${JSON.stringify(g)}`);
      }
    }
  }
}

console.log(`\n${"=".repeat(60)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failures.length > 0) {
  console.log(`Failures:`);
  for (const f of failures) console.log(`  - ${f}`);
}

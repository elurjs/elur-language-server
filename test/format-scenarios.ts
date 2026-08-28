/**
 * format-scenarios.ts — Realistic formatting test scenarios.
 *
 * These represent the actual patterns used in Elur apps:
 * - Function components
 * - Class components with `new`
 * - setChildren / setSlot chaining
 * - Function components with props
 * - Nested components inside html``
 * - repeat() for lists
 * - Event bindings with modifiers
 * - Reactive expressions ${() => ...}
 * - Mixed HTML + components
 */

import { findTemplateRegions } from "../src/template/detector.js";
import { buildTree } from "../src/formatting/ast.js";
import { formatNodes } from "../src/formatting/printer.js";

/**
 * Formats the html`` template regions in a source string.
 * Returns the full source with formatted templates.
 */
function formatTemplate(source: string, indentChar = "  "): string {
  const regions = findTemplateRegions(source);
  let result = source;
  let offset = 0;

  for (const region of regions) {
    if (regions.some(o => o !== region && region.innerStart >= o.innerStart && region.innerEnd <= o.innerEnd)) continue;
    const tree = buildTree(region.inner);
    const lines = formatNodes(tree, region.baseIndent + 1, indentChar);
    const formatted = `\n${lines.join("\n")}\n${indentChar.repeat(region.baseIndent)}`;
    const start = region.innerStart + offset;
    const end = region.innerEnd + offset;
    result = result.slice(0, start) + formatted + result.slice(end);
    offset += formatted.length - (end - start);
  }

  return result;
}

interface Scenario {
  name: string;
  input: string;
  expected: string;
}

export const scenarios: Scenario[] = [
  // ── 1. Simple function component ──────────────────────────────────────────
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

  // ── 2. Class component with lifecycle ─────────────────────────────────────
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

  // ── 3. Component with setChildren (chained) ───────────────────────────────
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

  // ── 4. Named slots with setSlot + setChildren ─────────────────────────────
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

  // ── 5. Function component with props ──────────────────────────────────────
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

  // ── 6. Nested components (class inside class) ─────────────────────────────
  {
    name: "nested class components",
    input: `class ThemedButton extends ElurComponent {
  render() {
    return html\`<button style=\${() => \`background:\${this.theme}\`}>Click me</button>\`;
  }
}

class ThemeProvider extends ElurComponent {
  render() {
    return html\`
      <div>
        \${new ThemedButton()}
      </div>
    \`;
  }
}`,
    expected: `class ThemedButton extends ElurComponent {
  render() {
    return html\`<button style=\${() => \`background:\${this.theme}\`}>Click me</button>\`;
  }
}

class ThemeProvider extends ElurComponent {
  render() {
    return html\`
      <div>
        \${new ThemedButton()}
      </div>
    \`;
  }
}`,
  },

  // ── 7. repeat() list rendering ────────────────────────────────────────────
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

  // ── 8. Event modifiers ────────────────────────────────────────────────────
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

  // ── 9. Mixed HTML + components + expressions ──────────────────────────────
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

  // ── 10. Complex nested template (from real landing page) ──────────────────
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

  // ── 11. Deeply nested HTML structure ──────────────────────────────────────
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

  // ── 12. Multi-line expression (block expr) ────────────────────────────────
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

  // ── 13. Array of components ───────────────────────────────────────────────
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

  // ── 14. Long attribute that needs wrapping ────────────────────────────────
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

  // ── 15. Template with no content ──────────────────────────────────────────
  {
    name: "empty template",
    input: `html\`\``,
    expected: `html\`\``,
  },

  // ── 16. Template with only text ───────────────────────────────────────────
  {
    name: "text only template",
    input: `html\`Hello world\``,
    expected: `html\`Hello world\``,
  },

  // ── 17. Conditional rendering with ternary ────────────────────────────────
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

  // ── 18. Self-closing void elements ────────────────────────────────────────
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

  // ── 19. Comments in template ──────────────────────────────────────────────
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

  // ── 20. Component with inline style binding ───────────────────────────────
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
];

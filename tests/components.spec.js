// Run with pnpm exec playwright test. All native fixtures use /src/elements.js.
import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/tests/fixture.html");
  await expect(page.locator("html")).toHaveAttribute("data-ready", "true");
});

async function mount(page, html, properties = {}) {
  await page.evaluate(([html, properties]) => window.fixture.mount(html, properties), [html, properties]);
}

async function events(page, id, type) {
  return page.evaluate(([id, type]) => window.fixture.events.filter((event) => event.id === id && event.type === type), [id, type]);
}

test("one native click emits once and submits once", async ({ page }) => {
  await mount(page, '<form id="form"><feyo-button id="save" type="submit">Save</feyo-button><feyo-icon-button id="icon" label="Action"></feyo-icon-button></form>');
  await page.evaluate(() => {
    window.submits = 0;
    document.getElementById("form").addEventListener("submit", (event) => { event.preventDefault(); window.submits++; });
  });
  await page.locator("#save button").click();
  expect(await events(page, "save", "click")).toHaveLength(1);
  expect(await page.evaluate(() => window.submits)).toBe(1);
  await page.locator("#icon button").click();
  expect(await events(page, "icon", "click")).toHaveLength(1);
  expect(await page.evaluate(() => window.submits)).toBe(1);
});

test("native default slot labels render in switch, card and badge", async ({ page }) => {
  await mount(page, `<feyo-switch id="native-switch">Sync</feyo-switch>
    <feyo-card id="native-card"><span>Card body</span></feyo-card>
    <feyo-badge id="native-badge">New</feyo-badge>`);
  await expect(page.locator("#native-switch .feyo-switch__label")).toHaveText("Sync");
  await expect(page.locator("#native-card .feyo-card__body")).toHaveText("Card body");
  await expect(page.locator("#native-badge")).toHaveText("New");
});

test("native button, icon button and card clicks are one real MouseEvent", async ({ page }) => {
  await mount(page, `<feyo-button id="native-button">Save</feyo-button>
    <feyo-icon-button id="native-icon" label="Action"></feyo-icon-button>
    <feyo-card id="native-click-card" clickable>Open</feyo-card>`);
  await page.locator("#native-button button").click();
  await page.locator("#native-icon button").click();
  await page.locator("#native-click-card .feyo-card").click();
  for (const id of ["native-button", "native-icon", "native-click-card"]) {
    const clickEvents = await events(page, id, "click");
    expect(clickEvents).toHaveLength(1);
    expect(clickEvents[0].mouseEvent).toBe(true);
  }
});

test("custom element host ids are not duplicated on internal elements", async ({ page }) => {
  await mount(page, `<feyo-button id="button">Button</feyo-button>
    <feyo-icon-button id="icon" label="Icon"></feyo-icon-button>
    <feyo-badge id="badge">Badge</feyo-badge>
    <feyo-progress id="progress" value="20"></feyo-progress>
    <feyo-checkbox id="checkbox">Check</feyo-checkbox>
    <feyo-switch id="switch">Switch</feyo-switch>
    <feyo-slider id="slider"></feyo-slider>
    <feyo-table id="table"></feyo-table>
    <feyo-menu id="menu"></feyo-menu>
    <feyo-dialog id="dialog"></feyo-dialog>
    <feyo-card id="card">Card</feyo-card>
    <feyo-divider id="divider"></feyo-divider>
    <feyo-layout id="layout">Layout</feyo-layout>
    <feyo-button-group id="group"></feyo-button-group>
    <feyo-tooltip id="tooltip" text="Hint">Trigger</feyo-tooltip>`);
  for (const id of ["button", "icon", "badge", "progress", "checkbox", "switch", "slider", "table", "menu", "dialog", "card", "divider", "layout", "group", "tooltip"]) {
    await expect(page.locator(`[id="${id}"]`)).toHaveCount(1);
  }
});

test("slider clamps displayed value when model and bounds are out of range", async ({ page }) => {
  await mount(page, '<feyo-slider id="slider" min="10" max="100" model-value="200" show-value></feyo-slider>');
  await expect(page.locator("#slider input")).toHaveValue("100");
  await expect(page.locator("#slider output")).toHaveText("100");
  await page.evaluate(() => { document.getElementById("slider").max = 50; });
  await expect(page.locator("#slider input")).toHaveValue("50");
  await expect(page.locator("#slider output")).toHaveText("50");
});

test("layout max width uses border-box sizing", async ({ page }) => {
  await mount(page, '<feyo-layout id="layout" max-width="320">Content</feyo-layout>');
  await expect(page.locator("#layout > .feyo-layout")).toHaveCSS("max-width", "320px");
  await expect(page.locator("#layout > .feyo-layout")).toHaveCSS("box-sizing", "border-box");
});

test("native form controls use their field names and enforce required", async ({ page }) => {
  await mount(page, `<form id="form">
    <feyo-text-field id="text" name="email" label="Email" required></feyo-text-field>
    <feyo-checkbox id="check" name="terms" label="Terms" value="yes" required></feyo-checkbox>
    <feyo-switch id="switch" name="sync" value="enabled" required>Sync</feyo-switch>
    <feyo-slider id="slider" name="volume" label="Volume" model-value="25"></feyo-slider>
    <feyo-select id="select" name="country" label="Country" required></feyo-select>
  </form>`, { select: { items: [{ value: "cn", label: "China" }] } });
  const validity = () => page.evaluate(() => [...document.getElementById("form").elements].filter((el) => el.name).map((el) => [el.name, el.validity.valid]));
  expect(await validity()).toEqual([["email", false], ["terms", false], ["sync", false], ["volume", true], ["country", false]]);
  await page.locator("#text input").fill("person@example.test");
  await page.locator("#check input").check();
  await page.locator("#switch input").check();
  await page.locator("#select .feyo-select__trigger").click();
  await page.getByRole("option", { name: "China" }).click();
  expect(await page.evaluate(() => document.getElementById("form").checkValidity())).toBe(true);
  expect(await page.evaluate(() => Object.fromEntries(new FormData(document.getElementById("form"))))).toEqual({ email: "person@example.test", terms: "yes", sync: "enabled", volume: "25", country: "cn" });
  expect(await events(page, "select", "change")).toHaveLength(1);
});

for (const [tag, attributes, input, changed, initial] of [
  ["text-field", 'label="Text" model-value="initial"', "input", "changed", "initial"],
  ["checkbox", 'label="Check" model-value', "input", false, true],
  ["switch", 'model-value', "input", false, true],
  ["slider", 'label="Volume" model-value="25"', "input", "26", "25"],
]) {
  test(`${tag} native reset restores UI and form value`, async ({ page }) => {
    await mount(page, `<form id="form"><feyo-${tag} id="field" name="field" ${attributes}>Field</feyo-${tag}><button type="reset">Reset</button></form>`);
    const control = page.locator(`#field ${input}`);
    if (typeof changed === "boolean") await control.uncheck();
    else if (tag === "slider") await control.press("ArrowRight");
    else await control.fill(changed);
    await page.getByRole("button", { name: "Reset" }).click();
    if (typeof initial === "boolean") await expect(control).toBeChecked();
    else await expect(control).toHaveValue(initial);
    // A subsequent render must not resurrect the stale pre-reset local state.
    await page.evaluate(() => { document.getElementById("field").disabled = true; });
    await expect(control).toBeDisabled();
    await page.evaluate(() => { document.getElementById("field").disabled = false; });
    if (typeof initial === "boolean") await expect(control).toBeChecked();
    else await expect(control).toHaveValue(initial);
  });
}

test("select placeholder is empty, required, clearable and resettable", async ({ page }) => {
  await mount(page, '<form id="form"><feyo-select id="select" name="choice" label="Choice" required clearable></feyo-select><button type="reset">Reset</button></form>', { select: { items: [{ value: 0, label: "Zero" }, { value: 1, label: "One" }] } });
  const native = page.locator("#select select");
  await expect(native.locator("option").first()).toHaveAttribute("value", "");
  await expect(native).toHaveValue("");
  expect(await native.evaluate((el) => el.validity.valueMissing)).toBe(true);
  await page.evaluate(() => document.getElementById("form").reportValidity());
  await expect(page.locator("#select .feyo-select__trigger")).toBeFocused();
  await page.locator("#select .feyo-select__trigger").click();
  await page.getByRole("option", { name: "Zero" }).click();
  await expect(native).toHaveValue("0");
  expect((await events(page, "select", "change"))[0].detail).toEqual([0]);
  await page.getByRole("button", { name: "清除选择" }).click();
  await expect(native).toHaveValue("");
  expect((await events(page, "select", "change"))[1].detail).toEqual([null]);
  await page.locator("#select .feyo-select__trigger").click();
  await page.getByRole("option", { name: "One" }).click();
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(native).toHaveValue("");
  await expect(page.locator("#select .feyo-select__trigger")).toContainText("请选择");
  expect(await native.evaluate((el) => el.validity.valueMissing)).toBe(true);
});

test("select reset preserves its initial numeric value and respects cancellation", async ({ page }) => {
  await mount(page, '<form id="form"><feyo-select id="select" name="choice" label="Choice" clearable></feyo-select><button type="reset">Reset</button></form>', { select: { modelValue: 0, items: [{ value: 0, label: "Zero" }, { value: 1, label: "One" }] } });
  await page.locator("#select .feyo-select__trigger").click();
  await page.getByRole("option", { name: "One" }).click();
  await page.evaluate(() => document.getElementById("form").addEventListener("reset", (event) => event.preventDefault(), { once: true }));
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.locator("#select select")).toHaveValue("1");
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.locator("#select select")).toHaveValue("0");
  await expect(page.locator("#select .feyo-select__trigger")).toContainText("Zero");
});

test("select object values retain identity in events but form submission is a string", async ({ page }) => {
  await mount(page, '<form id="form"><feyo-select id="select" name="choice" label="Choice"></feyo-select></form>', { select: { items: [{ value: { id: 7 }, label: "Object" }] } });
  await page.locator("#select .feyo-select__trigger").click();
  await page.getByRole("option", { name: "Object" }).click();
  expect((await events(page, "select", "change"))[0].detail).toEqual([{ id: 7 }]);
  expect(await page.evaluate(() => window.fixture.events.find((event) => event.type === "change").detail[0] === document.getElementById("select").items[0].value)).toBe(true);
  expect(await page.evaluate(() => new FormData(document.getElementById("form")).get("choice"))).toBe("[object Object]");
  await page.locator("#select .feyo-select__trigger").click();
  await expect(page.getByRole("option", { name: "Object" })).toHaveAttribute("aria-selected", "true");
});

test("select filtering and keyboard skip disabled options", async ({ page }) => {
  await mount(page, '<feyo-select id="select" label="Choice" searchable></feyo-select><button id="after">After</button>', { select: { items: [{ value: "a", label: "Alpha" }, { value: "b", label: "Beta", disabled: true }, { value: "c", label: "Gamma", description: "Last" }] } });
  const trigger = page.locator("#select .feyo-select__trigger");
  await trigger.press("ArrowDown");
  const search = page.getByRole("combobox", { name: "搜索选项" });
  await expect(search).toBeFocused();
  await search.press("ArrowDown");
  await search.press("Enter");
  await expect(trigger).toContainText("Gamma");
  await expect(trigger).toBeFocused();
  await trigger.click();
  await search.fill("No match");
  await expect(page.getByRole("option")).toHaveCount(0);
  await search.fill("last");
  await expect(page.getByRole("option")).toHaveCount(1);
  await search.press("Escape");
  await expect(trigger).toBeFocused();
  await trigger.click();
  await search.press("Tab");
  await expect(page.getByRole("listbox")).toHaveCount(0);
  await expect(page.locator("#after")).toBeFocused();
});

test("menu tabs and groups respond without event roundtrips", async ({ page }) => {
  const items = [{ value: "a", label: "Alpha" }, { value: "b", label: "Beta", disabled: true }, { value: "c", label: "Gamma" }];
  await mount(page, '<feyo-menu id="menu"></feyo-menu><feyo-tabs id="tabs"></feyo-tabs><feyo-button-group id="group" multiple></feyo-button-group>', { menu: { items }, tabs: { items }, group: { items } });
  await page.locator("#menu .feyo-menu__trigger").click();
  await expect(page.locator("#menu [role=menu]")).toBeVisible();
  await page.locator("#menu [role=menuitemradio]").filter({ hasText: "Gamma" }).click();
  await expect(page.locator("#menu [role=menu]")).toHaveCount(0);
  await expect(page.locator("#menu .feyo-menu__trigger")).toContainText("Gamma");
  await page.locator("#tabs [role=tab]").first().press("ArrowRight");
  await expect(page.locator("#tabs [role=tab]").last()).toHaveAttribute("aria-selected", "true");
  await page.locator("#group button").first().click();
  await page.locator("#group button").last().click();
  await expect(page.locator("#group .feyo-button-group__item--selected")).toHaveCount(2);
  expect((await events(page, "group", "change")).at(-1).detail).toEqual([["a", "c"]]);
  await page.locator("#group button").first().click();
  expect((await events(page, "group", "change")).at(-1).detail).toEqual([["c"]]);
});

test("dialog traps Tab, closes on Escape and returns focus", async ({ page }) => {
  await mount(page, '<button id="launch">Open</button><feyo-dialog id="dialog" title="Confirm"><button id="first" autofocus>First</button><button id="last">Last</button></feyo-dialog>');
  await page.evaluate(() => document.getElementById("launch").addEventListener("click", () => { document.getElementById("dialog").open = true; }));
  await page.locator("#launch").click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator("#first")).toBeFocused();
  await page.locator("#last").focus();
  await page.keyboard.press("Tab");
  await expect(page.locator("#dialog .feyo-dialog__close")).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.locator("#last")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.locator("#launch")).toBeFocused();
  expect(await events(page, "dialog", "close")).toHaveLength(1);
});

test("dialog Escape closes once and independently restores launcher focus", async ({ page }) => {
  await mount(page, '<button id="launch">Open</button><feyo-dialog id="dialog" title="Confirm"><button id="first" autofocus>First</button></feyo-dialog>');
  await page.evaluate(() => document.getElementById("launch").addEventListener("click", () => { document.getElementById("dialog").open = true; }));
  await page.locator("#launch").click();
  await expect(page.locator("#first")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.locator("#launch")).toBeFocused();
  expect((await events(page, "dialog", "close"))[0].detail).toEqual(["escape"]);
  expect(await events(page, "dialog", "close")).toHaveLength(1);
});

test("notification title attrs and heading do not fight native title", async ({ page }) => {
  await mount(page, '<feyo-notification id="notice" open title="Legacy title" duration="0"></feyo-notification>');
  await expect(page.locator("#notice .feyo-notification__title")).toHaveText("Legacy title");
  await page.evaluate(() => { document.getElementById("notice").title = "Native update"; });
  await expect(page.locator("#notice .feyo-notification__title")).toHaveText("Native update");
  await page.evaluate(() => { document.getElementById("notice").heading = "Heading wins"; });
  await expect(page.locator("#notice .feyo-notification__title")).toHaveText("Heading wins");
  expect(await page.locator("#notice").evaluate((el) => el.title)).toBe("Native update");
  await page.getByRole("button", { name: "关闭通知" }).click();
  await expect(page.locator("#notice .feyo-notification")).toBeHidden();
  expect((await events(page, "notice", "close"))[0].detail).toEqual(["button"]);
});

test("notification timeout, hover and focus use remaining time", async ({ page }) => {
  await page.clock.install();
  await page.clock.pauseAt(new Date());
  await mount(page, '<feyo-notification id="notice" open heading="Saved" duration="1000"><button id="action" slot="action">Undo</button></feyo-notification><button id="outside">Outside</button>');
  const notice = page.locator("#notice .feyo-notification");
  await page.clock.runFor(300);
  // Synthetic mouse events work identically in desktop and touch contexts.
  await notice.dispatchEvent("mouseenter");
  await page.clock.runFor(1200);
  await expect(notice).toBeVisible();
  await page.locator("#action").focus();
  await notice.dispatchEvent("mouseleave");
  await page.clock.runFor(1200);
  await expect(notice).toBeVisible();
  await page.locator("#outside").focus();
  await page.clock.runFor(699);
  await expect(notice).toBeVisible();
  await page.clock.runFor(1);
  await expect(notice).toBeHidden();
  expect((await events(page, "notice", "close"))[0].detail).toEqual(["timeout"]);
  await page.clock.runFor(2000);
  expect(await events(page, "notice", "close")).toHaveLength(1);
});

test("notification duration changes, zero, reopen and unmount clean up timers", async ({ page }) => {
  await page.clock.install();
  await page.clock.pauseAt(new Date());
  await mount(page, '<feyo-notification id="notice" open heading="Saved" duration="1000"></feyo-notification>');
  await page.clock.runFor(300);
  await page.evaluate(() => { document.getElementById("notice").duration = 0; });
  await page.clock.runFor(2000);
  await expect(page.locator("#notice .feyo-notification")).toBeVisible();
  await page.evaluate(() => { document.getElementById("notice").open = false; });
  await page.evaluate(() => { const notice = document.getElementById("notice"); notice.duration = 500; notice.open = true; });
  await page.clock.runFor(499);
  await expect(page.locator("#notice .feyo-notification")).toBeVisible();
  await page.clock.runFor(1);
  await expect(page.locator("#notice .feyo-notification")).toBeHidden();
  await page.evaluate(() => { const notice = document.getElementById("notice"); notice.open = false; });
  await page.evaluate(() => { document.getElementById("notice").open = true; });
  await page.evaluate(() => { document.getElementById("notice").remove(); });
  await page.clock.runFor(2000);
  expect(await events(page, "notice", "close")).toHaveLength(1);
});

test("table selection is local, accessible, keyed and externally overridable", async ({ page }) => {
  await mount(page, '<feyo-table id="table" selectable row-key="id"></feyo-table>', { table: { columns: [{ key: "name", label: "Name" }], rows: [{ id: "a", name: "Alice" }, { id: "b", name: "Bob" }], modelValue: ["hidden"] } });
  const checks = page.locator("#table [role=checkbox]");
  await checks.nth(1).click();
  await expect(checks.nth(1)).toHaveAttribute("aria-checked", "true");
  await expect(checks.first()).toHaveAttribute("aria-checked", "mixed");
  await page.locator("#table tbody tr").last().press("Space");
  await expect(checks.first()).toHaveAttribute("aria-checked", "true");
  expect((await events(page, "table", "update:modelValue")).at(-1).detail).toEqual([["hidden", "a", "b"]]);
  await page.evaluate(() => { document.getElementById("table").rows = [{ id: "b", name: "Bob" }, { id: "a", name: "Alice" }]; });
  await expect(checks.nth(1)).toHaveAttribute("aria-checked", "true");
  await checks.first().click();
  expect((await events(page, "table", "update:modelValue")).at(-1).detail).toEqual([["hidden"]]);
  await page.evaluate(() => { document.getElementById("table").modelValue = ["b"]; });
  await expect(checks.nth(1)).toHaveAttribute("aria-checked", "true");
  await expect(checks.nth(2)).toHaveAttribute("aria-checked", "false");
  expect(await events(page, "table", "row-click")).toHaveLength(0);
});

test("table sorting is an external contract and keyed DOM survives reorder", async ({ page }) => {
  await mount(page, '<feyo-table id="table" row-key="id"></feyo-table>', { table: { columns: [{ key: "score", label: "Score", sortable: true }], rows: [{ id: "b", score: 20 }, { id: "a", score: 10 }] } });
  const sort = page.locator("#table .feyo-table__sort-button");
  await page.evaluate(() => { window.firstRow = document.querySelector("#table tbody tr"); });
  await sort.click();
  expect((await events(page, "table", "sort-change"))[0].detail).toEqual([{ key: "score", direction: "asc" }]);
  await expect(page.locator("#table tbody tr")).toHaveText(["20", "10"]);
  await page.evaluate(() => {
    const table = document.getElementById("table");
    const { key, direction } = window.fixture.events.find((event) => event.type === "sort-change").detail[0];
    table.sortKey = key;
    table.sortDirection = direction;
    table.rows = [...table.rows].sort((a, b) => a[key] - b[key]);
  });
  await expect(page.locator("#table tbody tr")).toHaveText(["10", "20"]);
  expect(await page.evaluate(() => window.firstRow === document.querySelector("#table tbody tr:last-child"))).toBe(true);
  await expect(page.locator("#table th")).toHaveAttribute("aria-sort", "ascending");
  await sort.click();
  expect((await events(page, "table", "sort-change"))[1].detail).toEqual([{ key: "score", direction: "desc" }]);
});

test("table items keeps documented precedence including an empty array", async ({ page }) => {
  await mount(page, '<feyo-table id="table"><span slot="empty">Empty items</span></feyo-table>', { table: { columns: [{ key: "name", label: "Name" }], rows: [{ id: "a", name: "Alice" }], items: [] } });
  await expect(page.locator("#table tbody")).toHaveText("Empty items");
  await page.evaluate(() => { document.getElementById("table").items = undefined; });
  await expect(page.locator("#table tbody")).toHaveText("Alice");
});

test("native empty-state named slots survive whitespace without an icon gap", async ({ page }) => {
  await mount(page, `<feyo-empty-state id="empty" title="No results">
    <button slot="action">Create</button>
  </feyo-empty-state><feyo-empty-state id="icon" title="No results"><span slot="icon">X</span></feyo-empty-state>`);
  await expect(page.locator("#empty .feyo-empty-state__action button")).toHaveText("Create");
  expect(await page.locator("#empty .feyo-empty-state__icon").evaluate((el) => el.getBoundingClientRect().height)).toBe(0);
  await expect(page.locator("#icon .feyo-empty-state__icon span")).toHaveText("X");
  expect(await page.locator("#icon .feyo-empty-state__icon").evaluate((el) => el.getBoundingClientRect().height)).toBe(48);
});

test("Vue consumers retain v-model, title attrs, scoped slots and component styles", async ({ page }) => {
  await page.evaluate(() => window.fixture.mountVue());
  await page.locator("#vue-button").click();
  await expect(page.locator("#vue-clicks")).toHaveText("1");
  // A grid child is blockified by CSS, so inline-flex computes to flex here.
  expect(["flex", "inline-flex"]).toContain(await page.locator("#vue-button").evaluate((el) => getComputedStyle(el).display));
  await page.locator("#vue-select .feyo-select__trigger").click();
  await page.getByRole("option", { name: "Two" }).click();
  await expect(page.locator("#vue-choice")).toHaveText("2");
  await page.locator("#vue-table tbody [role=checkbox]").click();
  await expect(page.locator("#vue-selected")).toHaveText("a");
  await expect(page.locator("#vue-table tbody button").last()).toHaveText("Alice");
  await expect(page.locator("#vue-empty .feyo-empty-state__action button")).toHaveText("Create");
  await page.locator("#vue-title").click();
  await expect(page.locator("#vue-notification .feyo-notification__title")).toHaveText("Updated title");
  await page.getByRole("button", { name: "关闭通知" }).click();
  await expect(page.locator("#vue-open")).toHaveText("false");
});

test("IDs stay unique across elements, updates and disconnect/reconnect", async ({ page }) => {
  await mount(page, '<feyo-select id="one" label="One"></feyo-select><feyo-select id="two" label="Two"></feyo-select><feyo-text-field id="text-one" label="Text one"></feyo-text-field><feyo-text-field id="text-two" label="Text two"></feyo-text-field>');
  const before = await page.locator("[id]").evaluateAll((nodes) => nodes.map((node) => node.id));
  expect(new Set(before).size).toBe(before.length);
  await page.evaluate(async () => {
    const host = document.getElementById("one");
    host.label = "Changed";
    host.remove();
    document.getElementById("fixture").append(host);
    await Promise.resolve();
  });
  const after = await page.locator("[id]").evaluateAll((nodes) => nodes.map((node) => node.id));
  expect([...after].sort()).toEqual([...before].sort());
  expect(await page.locator("#one .feyo-select__trigger").getAttribute("aria-labelledby")).toBe(await page.locator("#one .feyo-select__label").getAttribute("id"));
});

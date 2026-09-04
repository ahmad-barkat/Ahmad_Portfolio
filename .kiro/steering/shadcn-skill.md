---
inclusion: always
---

# shadcn/ui Skill
> Source: https://github.com/shadcn-ui/ui (Official shadcn/ui AI Skill)
> Install: `npx skills add shadcn/ui`

shadcn/ui is **not** a component library — it's a collection of copy-paste components added as source code to your project. You own the code. Components are not installed as dependencies.

> **CLI runner:** Always use the project's package manager — `npx shadcn@latest`, `pnpm dlx shadcn@latest`, or `bunx --bun shadcn@latest`. Examples use `npx` but substitute accordingly.

---

## Principles

1. **Use existing components first.** Run `npx shadcn@latest search` before writing custom UI.
2. **Compose, don't reinvent.** Settings page = `Tabs` + `Card` + form controls. Dashboard = `Sidebar` + `Card` + `Chart` + `Table`.
3. **Use built-in variants before custom styles.** `variant="outline"`, `size="sm"`, etc.
4. **Use semantic colors.** `bg-primary`, `text-muted-foreground` — never raw values like `bg-blue-500`.

---

## Critical Rules

### Styling & Tailwind
- **`className` for layout, not styling.** Never override component colors or typography.
- **No `space-x-*` or `space-y-*`.** Use `flex` with `gap-*`. For vertical stacks, `flex flex-col gap-*`.
- **Use `size-*` when width and height are equal.** `size-10` not `w-10 h-10`.
- **Use `truncate` shorthand.** Not `overflow-hidden text-ellipsis whitespace-nowrap`.
- **No manual `dark:` color overrides.** Use semantic tokens (`bg-background`, `text-muted-foreground`).
- **Use `cn()` for conditional classes.** Don't write manual template literal ternaries.
- **No manual `z-index` on overlay components.** Dialog, Sheet, Popover, etc. handle their own stacking.

### Forms & Inputs
- **Forms use `FieldGroup` + `Field`.** Never use raw `div` with `space-y-*` or `grid gap-*` for form layout.
- **`InputGroup` uses `InputGroupInput`/`InputGroupTextarea`.** Never raw `Input`/`Textarea` inside `InputGroup`.
- **Buttons inside inputs use `InputGroup` + `InputGroupAddon`.**
- **Option sets (2–7 choices) use `ToggleGroup`.** Don't loop `Button` with manual active state.
- **`FieldSet` + `FieldLegend` for grouping related checkboxes/radios.**
- **Field validation uses `data-invalid` + `aria-invalid`.** `data-invalid` on `Field`, `aria-invalid` on the control. For disabled: `data-disabled` on `Field`, `disabled` on the control.

### Component Structure / Composition
- **Items always inside their Group.** `SelectItem` → `SelectGroup`. `DropdownMenuItem` → `DropdownMenuGroup`. `CommandItem` → `CommandGroup`.
- **Use `asChild` (Radix) or `render` (Base UI) for custom triggers.**
- **Dialog, Sheet, and Drawer always need a Title.** `DialogTitle`, `SheetTitle`, `DrawerTitle` required for accessibility. Use `className="sr-only"` if visually hidden.
- **Use full Card composition.** `CardHeader` / `CardTitle` / `CardDescription` / `CardContent` / `CardFooter`. Don't dump everything in `CardContent`.
- **Button has no `isPending`/`isLoading`.** Compose with `Spinner` + `data-icon` + `disabled`.
- **`TabsTrigger` must be inside `TabsList`.**
- **`Avatar` always needs `AvatarFallback`.**

### Use Components, Not Custom Markup
- **Callouts use `Alert`.** Don't build custom styled divs.
- **Empty states use `Empty`.**
- **Toast via `sonner`.** Use `toast()` from `sonner`.
- **Use `Separator`** instead of `<hr>` or `<div className="border-t">`.
- **Use `Skeleton`** for loading placeholders. No custom `animate-pulse` divs.
- **Use `Badge`** instead of custom styled spans.

### Icons
- **Icons in `Button` use `data-icon`.** `data-icon="inline-start"` or `data-icon="inline-end"` on the icon.
- **No sizing classes on icons inside components.** Components handle icon sizing via CSS. No `size-4` or `w-4 h-4`.
- **Pass icons as objects, not string keys.** `icon={CheckIcon}`, not a string lookup.
- **Check `iconLibrary` from project context** — use `lucide-react` for `lucide`, `@tabler/icons-react` for `tabler`, etc. Never assume `lucide-react`.

---

## Key Patterns (Correct vs Wrong)

```tsx
// ✅ Form layout: FieldGroup + Field
<FieldGroup>
  <Field>
    <FieldLabel htmlFor="email">Email</FieldLabel>
    <Input id="email" />
  </Field>
</FieldGroup>

// ✅ Validation state
<Field data-invalid>
  <FieldLabel>Email</FieldLabel>
  <Input aria-invalid />
  <FieldDescription>Invalid email.</FieldDescription>
</Field>

// ✅ Icons in buttons: data-icon, no sizing classes
<Button>
  <SearchIcon data-icon="inline-start" />
  Search
</Button>

// ✅ Spacing: gap-*, not space-y-*
<div className="flex flex-col gap-4">   // correct
<div className="space-y-4">            // wrong ❌

// ✅ Equal dimensions: size-*, not w-* h-*
<Avatar className="size-10">    // correct
<Avatar className="w-10 h-10">  // wrong ❌

// ✅ Status colors: Badge variants or semantic tokens
<Badge variant="secondary">+20.1%</Badge>        // correct
<span className="text-emerald-600">+20.1%</span> // wrong ❌

// ✅ cn() for conditional classes
<div className={cn("base-class", isActive && "active-class")}>
```

---

## Component Selection Reference

| Need | Use |
|------|-----|
| Button/action | `Button` with appropriate variant |
| Form inputs | `Input`, `Select`, `Combobox`, `Switch`, `Checkbox`, `RadioGroup`, `Textarea`, `InputOTP`, `Slider` |
| Toggle between 2–5 options | `ToggleGroup` + `ToggleGroupItem` |
| Data display | `Table`, `Card`, `Badge`, `Avatar` |
| Navigation | `Sidebar`, `NavigationMenu`, `Breadcrumb`, `Tabs`, `Pagination` |
| Overlays | `Dialog` (modal), `Sheet` (side panel), `Drawer` (bottom sheet), `AlertDialog` (confirmation) |
| Feedback | `sonner` (toast), `Alert`, `Progress`, `Skeleton`, `Spinner` |
| Command palette | `Command` inside `Dialog` |
| Charts | `Chart` (wraps Recharts) |
| Layout | `Card`, `Separator`, `Resizable`, `ScrollArea`, `Accordion`, `Collapsible` |
| Empty states | `Empty` |
| Menus | `DropdownMenu`, `ContextMenu`, `Menubar` |
| Tooltips/info | `Tooltip`, `HoverCard`, `Popover` |
| Chat / conversation UI | `MessageScroller`, `Message`, `Bubble`, `Attachment`, `Marker` |

---

## Project Context Fields (from `npx shadcn@latest info`)

Always check these before writing code:

- **`aliases`** — use the actual alias prefix for imports (`@/`, `~/`), never hardcode
- **`isRSC`** — when `true`, components using `useState`, `useEffect`, event handlers, or browser APIs need `"use client"` at the top
- **`tailwindVersion`** — `"v4"` uses `@theme inline` blocks; `"v3"` uses `tailwind.config.js`
- **`tailwindCssFile`** — the global CSS file where custom CSS variables are defined; always edit this, never create a new one
- **`style`** — component visual treatment (`nova`, `vega`, `maia`, `lyra`, `mira`, `luma`)
- **`base`** — primitive library (`radix` or `base`); affects component APIs and available props
- **`iconLibrary`** — determines icon imports; never assume `lucide-react`
- **`resolvedPaths`** — exact file-system destinations for components, utils, hooks, etc.
- **`framework`** — routing and file conventions (Next.js App Router vs Vite SPA, etc.)
- **`packageManager`** — use for any non-shadcn dependency installs
- **`preset`** — resolved preset code and values for the current project

---

## Workflow

1. **Get project context** — run `npx shadcn@latest info` to get config and installed components
2. **Check installed components first** — before `add`, check the `components` list. Don't import uninstalled components; don't re-add already installed ones
3. **Find components** — `npx shadcn@latest search`
4. **Get docs and examples** — run `npx shadcn@latest docs <component>` to get URLs, then fetch them. Use `npx shadcn@latest view` to browse registry items not yet installed
5. **Install or update** — `npx shadcn@latest add`. When updating existing components, use `--dry-run` and `--diff` to preview first
6. **Fix imports after adding community components** — third-party registry items may use default paths like `@/components/ui/...` that won't match your project aliases. Rewrite them after `add`
7. **Review added components** — always read added files and verify correctness: missing sub-components, missing imports, wrong composition, icon library mismatches
8. **Registry must be explicit** — if user says "add a login block" without specifying a registry (`@shadcn`, `@tailark`, `owner/repo`), **ask** which registry to use

---

## Updating Components (Smart Merge)

When updating a component while keeping local changes — **never fetch raw files from GitHub manually, always use the CLI**:

```bash
# 1. Preview all affected files
npx shadcn@latest add button --dry-run

# 2. See upstream diff for a specific file
npx shadcn@latest add button --diff button.tsx

# 3. Apply upstream changes while preserving local modifications
# (manually merge based on diff output)

# Only use --overwrite with explicit user approval
npx shadcn@latest add button --overwrite
```

---

## CLI Quick Reference

```bash
# Initialize a new project
npx shadcn@latest init --name my-app --preset base-nova
npx shadcn@latest init --name my-app --preset a2r6bw --template vite
npx shadcn@latest init --defaults   # shortcut: next + nova preset

# Initialize monorepo
npx shadcn@latest init --name my-app --preset base-nova --monorepo

# Initialize existing project
npx shadcn@latest init --preset base-nova

# Apply a preset to an existing project
npx shadcn@latest apply a2r6bw
npx shadcn@latest apply a2r6bw --only theme
npx shadcn@latest apply a2r6bw --only font
npx shadcn@latest apply a2r6bw --only theme,font

# Inspect preset codes
npx shadcn@latest preset decode a2r6bw
npx shadcn@latest preset url a2r6bw
npx shadcn@latest preset open a2r6bw
npx shadcn@latest preset resolve
npx shadcn@latest preset resolve --json

# Add components
npx shadcn@latest add button card dialog
npx shadcn@latest add @magicui/shimmer-button
npx shadcn@latest add owner/repo/item
npx shadcn@latest add --all

# Preview before adding/updating
npx shadcn@latest add button --dry-run
npx shadcn@latest add button --diff button.tsx

# Search registries
npx shadcn@latest search @shadcn -q "sidebar"
npx shadcn@latest search @tailark -q "stats"
npx shadcn@latest search owner/repo -q "login"
npx shadcn@latest search                           # all configured registries
npx shadcn@latest search @shadcn -q "menu" -t ui   # filter by type

# Get component docs + example URLs
npx shadcn@latest docs button dialog select

# View registry item (not yet installed)
npx shadcn@latest view @shadcn/button
```

**Named presets:** `nova`, `vega`, `maia`, `lyra`, `mira`, `luma`  
**Templates:** `next`, `vite`, `start`, `react-router`, `astro` (all support `--monorepo`), `laravel`

---

## Switching Presets

Always ask user: **overwrite**, **partial**, **merge**, or **skip**?

- **Overwrite:** `npx shadcn@latest apply <code>` — overwrites components, fonts, CSS variables
- **Partial:** `npx shadcn@latest apply <code> --only theme,font` — updates only theme/font
- **Merge:** `npx shadcn@latest init --preset <code> --force --no-reinstall`, then smart-merge each component with `--dry-run` + `--diff`
- **Skip:** `npx shadcn@latest init --preset <code> --force --no-reinstall` — updates config and CSS only, leaves components as-is

> Always run preset commands inside the project directory. `apply` only works in a project with a `components.json` file.

---

## Chat UI Components

- **`MessageScroller`** owns scroll behavior — streaming follow, anchoring, and jump-to-latest built in. Don't write `useStickToBottom`/`ResizeObserver` hooks.
- **`Message`** for conversation rows, **`Bubble`** for message surfaces
- **`Attachment`** for file/media attachments; **`Marker`** for system notes and dividers
- Never hand-roll bubble `div`s or a raw scroll container

---

> Full docs: https://ui.shadcn.com/docs  
> Skills docs: https://ui.shadcn.com/docs/skills  
> Component registry: https://ui.shadcn.com/r

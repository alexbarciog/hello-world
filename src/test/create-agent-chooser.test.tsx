import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { CreateAgentChooser } from "@/components/templates/CreateAgentChooser";

const mocks = vi.hoisted(() => ({
  templates: [] as unknown[],
  allTemplates: [] as unknown[],
  adminTemplates: vi.fn(),
  isAdmin: false,
  applyTemplate: vi.fn(),
}));

vi.mock("@/lib/agentTemplates", () => ({
  usePublicTemplates: () => ({ data: mocks.templates }),
  useAllTemplates: () => ({ data: mocks.allTemplates }),
  applyTemplate: mocks.applyTemplate,
  adminTemplates: mocks.adminTemplates,
}));
vi.mock("@tanstack/react-query", () => ({ useQueryClient: () => ({ invalidateQueries: vi.fn() }) }));
vi.mock("@/hooks/useAdminCheck", () => ({ useAdminCheck: () => ({ data: mocks.isAdmin }) }));

const recruiter = {
  id: "t1",
  name: "Recruiter",
  business_type: "Recruiter",
  description: "Finds companies hiring.",
  icon: "users",
  config: { agent: { signals_config: { enabled: ["job_changes"] } }, campaign: { workflow_steps: [{}, {}] } },
};

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// The dialog renders in a portal, so look in the whole document.
const button = (text: string) => {
  const found = [...document.querySelectorAll("button")].find((b) => b.textContent?.includes(text));
  if (!found) throw new Error(`No button: ${text}`);
  return found;
};
const click = (el: HTMLElement) => act(async () => { el.click(); });

let root: Root;
let host: HTMLElement;

async function setup() {
  const onCustom = vi.fn();
  const onApplied = vi.fn();
  host = document.body.appendChild(document.createElement("div"));
  root = createRoot(host);
  await act(async () => {
    root.render(
      <MemoryRouter>
        <CreateAgentChooser open onOpenChange={vi.fn()} onCustom={onCustom} onApplied={onApplied} />
      </MemoryRouter>,
    );
  });
  return { onCustom, onApplied };
}

describe("CreateAgentChooser", () => {
  beforeEach(() => {
    mocks.templates = [recruiter];
    mocks.isAdmin = false;
    mocks.allTemplates = [];
    mocks.applyTemplate.mockReset();
    mocks.adminTemplates.mockReset();
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    host.remove();
  });

  it("offers both ways to start", async () => {
    const { onCustom } = await setup();
    expect(button("Use a ready template")).toBeTruthy();
    await click(button("Configure your own"));
    expect(onCustom).toHaveBeenCalledOnce();
  });

  it("lets people leave the marketplace to build a custom agent", async () => {
    const { onCustom } = await setup();
    await click(button("Use a ready template"));
    expect(document.body.textContent).toContain("Don't find what you're looking for?");
    await click(button("Build your custom Signal agent"));
    expect(onCustom).toHaveBeenCalledOnce();
  });

  it("creates the agent only after a template is picked", async () => {
    mocks.applyTemplate.mockResolvedValue({ agent_id: "a1", campaign_id: "c1", status: "active" });
    const { onApplied } = await setup();
    await click(button("Use a ready template"));
    expect(button("Use this template").disabled).toBe(true);
    await click(button("Finds companies hiring."));
    await click(button("Use this template"));
    expect(mocks.applyTemplate).toHaveBeenCalledWith("t1", "create");
    expect(onApplied).toHaveBeenCalledOnce();
    expect(onApplied.mock.calls[0][1].agent_id).toBe("a1");
  });

  it("tells admins how to add a template when there are none", async () => {
    mocks.allTemplates = [];
    mocks.isAdmin = true;
    await setup();
    await click(button("Use a ready template"));
    expect(document.body.textContent).toContain("open an agent and click Save as template");
  });

  it("shows admins private templates and lets them change visibility", async () => {
    mocks.allTemplates = [{ ...recruiter, is_public: false, archived_at: null }, { ...recruiter, id: "gone", business_type: "Archived one", is_public: false, archived_at: "2026-11-01" }];
    mocks.isAdmin = true;
    mocks.adminTemplates.mockResolvedValue({});
    await setup();
    await click(button("Use a ready template"));
    expect(document.body.textContent).toContain("Private");
    expect(document.body.textContent).not.toContain("Archived one");
    await click(document.querySelector('[role="switch"]') as HTMLElement);
    expect(mocks.adminTemplates).toHaveBeenCalledWith({ action: "update", id: "t1", is_public: true });
  });

  it("gives customers no admin controls", async () => {
    await setup();
    await click(button("Use a ready template"));
    expect(document.querySelector('[role="switch"]')).toBeNull();
    expect(document.body.textContent).not.toContain("Archive");
  });
});

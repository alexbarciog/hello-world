import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, Sparkles, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";
import type { ContactList } from "./types";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  lists: ContactList[];
  onImported: () => void;
}

const URL_REGEX = /linkedin\.com\/(company|school|showcase)\//i;

const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1001-5000", "5000+"];
const SENIORITIES = ["Owner", "Founder", "C-level", "VP", "Director", "Head of"];
const FUNCTIONS = ["Sales", "Marketing", "Operations", "Engineering", "Product", "Finance", "HR", "Other"];
const COMPANY_OPTIONS = [10, 25, 50, 100];
const PER_COMPANY_OPTIONS = [1, 2, 3];

export function FindLookalikesDialog({ open, onOpenChange, lists, onImported }: Props) {
  const today = useMemo(() => new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }), []);
  const [step, setStep] = useState(1);
  const [urlsText, setUrlsText] = useState("");
  const [industries, setIndustries] = useState<string[]>([]);
  const [industryInput, setIndustryInput] = useState("");
  const [companySizes, setCompanySizes] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [locationInput, setLocationInput] = useState("");
  const [seniorities, setSeniorities] = useState<string[]>([...SENIORITIES]);
  const [functions, setFunctions] = useState<string[]>([]);
  const [maxCompanies, setMaxCompanies] = useState(25);
  const [maxPerCompany, setMaxPerCompany] = useState(2);
  const [signalMode, setSignalMode] = useState<"industry" | "ai">("ai");
  const [listChoice, setListChoice] = useState<string>("__new__");
  const [newListName, setNewListName] = useState(`Lookalikes — ${today}`);
  const [submitting, setSubmitting] = useState(false);
  const [progressStatus, setProgressStatus] = useState<string>("");

  const urls = useMemo(
    () => urlsText.split(/\s*\n\s*/).map((u) => u.trim()).filter(Boolean),
    [urlsText]
  );
  const urlsValid = urls.length >= 3 && urls.length <= 4 && urls.every((u) => URL_REGEX.test(u));

  function reset() {
    setStep(1);
    setUrlsText("");
    setIndustries([]);
    setIndustryInput("");
    setCompanySizes([]);
    setLocations([]);
    setLocationInput("");
    setSeniorities([...SENIORITIES]);
    setFunctions([]);
    setMaxCompanies(25);
    setMaxPerCompany(2);
    setSignalMode("ai");
    setListChoice("__new__");
    setNewListName(`Lookalikes — ${today}`);
    setProgressStatus("");
  }

  function toggle<T>(arr: T[], val: T, setter: (v: T[]) => void) {
    setter(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  }

  function addChip(input: string, list: string[], setList: (v: string[]) => void, setInput: (v: string) => void) {
    const v = input.trim();
    if (!v) return;
    if (!list.includes(v)) setList([...list, v]);
    setInput("");
  }

  async function handleSubmit() {
    if (!urlsValid) {
      toast.error("Please paste 3–4 valid LinkedIn company URLs");
      setStep(1);
      return;
    }
    if (listChoice === "__new__" && !newListName.trim()) {
      toast.error("Please name the new list");
      return;
    }

    setSubmitting(true);
    setProgressStatus("Profiling your best customers…");

    // Cycle progress messages
    const messages = [
      "Profiling your best customers…",
      "Searching for similar companies…",
      "Finding decision-makers…",
      "Generating personalized signals…",
    ];
    let mi = 0;
    const interval = setInterval(() => {
      mi = (mi + 1) % messages.length;
      setProgressStatus(messages[mi]);
    }, 4000);

    try {
      const { data, error } = await supabase.functions.invoke("find-lookalike-leads", {
        body: {
          seed_urls: urls,
          filters: {
            industries,
            company_sizes: companySizes,
            locations,
            seniorities: seniorities.map((s) => s.toLowerCase()),
            functions: functions.map((f) => f.toLowerCase()),
            max_companies: maxCompanies,
            max_per_company: maxPerCompany,
          },
          signal_mode: signalMode,
          ...(listChoice === "__new__"
            ? { new_list_name: newListName.trim() }
            : { list_id: listChoice }),
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      const inserted = (data as any)?.inserted ?? 0;
      const duplicates = (data as any)?.duplicates ?? 0;
      const companies = (data as any)?.companies_scanned ?? 0;
      toast.success(
        `Found ${inserted} lookalike lead${inserted === 1 ? "" : "s"} from ${companies} compan${companies === 1 ? "y" : "ies"}` +
        (duplicates ? ` (${duplicates} duplicate${duplicates === 1 ? "" : "s"} skipped)` : ""),
      );
      reset();
      onOpenChange(false);
      onImported();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to find lookalike leads";
      toast.error(msg);
    } finally {
      clearInterval(interval);
      setSubmitting(false);
    }
  }

  const expected = maxCompanies * maxPerCompany;

  return (
    <Dialog open={open} onOpenChange={(v) => !submitting && onOpenChange(v)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Find Lookalike Leads
          </DialogTitle>
          <DialogDescription>
            Paste 3–4 LinkedIn company pages of your best customers. We'll find similar companies and surface their top decision-makers.
          </DialogDescription>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-center gap-2 py-2">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex items-center gap-2 flex-1">
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors",
                step === n ? "bg-primary text-primary-foreground" : step > n ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              )}>
                {step > n ? <Check className="w-3.5 h-3.5" /> : n}
              </div>
              <div className="text-xs font-medium">
                {n === 1 ? "Seed leads" : n === 2 ? "Filters" : "Review"}
              </div>
              {n < 3 && <div className={cn("flex-1 h-px", step > n ? "bg-primary/40" : "bg-border")} />}
            </div>
          ))}
        </div>

        {submitting ? (
          <div className="py-12 flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <div className="text-sm font-medium">{progressStatus}</div>
            <div className="text-xs text-muted-foreground">This can take 30–90 seconds. Please keep this dialog open.</div>
          </div>
        ) : (
          <>
            {/* Step 1: Seeds */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold mb-1.5 block">Best customers' LinkedIn company pages (3–4)</label>
                  <Textarea
                    value={urlsText}
                    onChange={(e) => setUrlsText(e.target.value)}
                    placeholder={"https://www.linkedin.com/company/acme-inc\nhttps://www.linkedin.com/company/globex\nhttps://www.linkedin.com/company/initech"}
                    className="min-h-[140px] text-xs font-mono"
                  />
                  <div className="text-xs text-muted-foreground mt-1.5">
                    {urls.length} URL{urls.length === 1 ? "" : "s"} entered
                    {urls.length > 0 && !urlsValid && (
                      <span className="text-destructive ml-2">
                        {urls.length < 3 ? "Need at least 3" : urls.length > 4 ? "Maximum 4" : "All URLs must be linkedin.com/company/…"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Filters */}
            {step === 2 && (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                <ChipField
                  label="Industries (optional)"
                  hint="We'll auto-detect from seed profiles too"
                  values={industries}
                  input={industryInput}
                  setInput={setIndustryInput}
                  onAdd={() => addChip(industryInput, industries, setIndustries, setIndustryInput)}
                  onRemove={(v) => setIndustries(industries.filter((x) => x !== v))}
                  placeholder="e.g. Marketing & Advertising"
                />

                <MultiToggle label="Company size" options={COMPANY_SIZES} values={companySizes} onToggle={(v) => toggle(companySizes, v, setCompanySizes)} />

                <ChipField
                  label="Locations (optional)"
                  values={locations}
                  input={locationInput}
                  setInput={setLocationInput}
                  onAdd={() => addChip(locationInput, locations, setLocations, setLocationInput)}
                  onRemove={(v) => setLocations(locations.filter((x) => x !== v))}
                  placeholder="e.g. United States"
                />

                <MultiToggle label="Decision-maker seniority" options={SENIORITIES} values={seniorities} onToggle={(v) => toggle(seniorities, v, setSeniorities)} />

                <MultiToggle label="Decision-maker functions" options={FUNCTIONS} values={functions} onToggle={(v) => toggle(functions, v, setFunctions)} />

                <div className="grid grid-cols-2 gap-4">
                  <NumPicker label="Max companies" options={COMPANY_OPTIONS} value={maxCompanies} onChange={setMaxCompanies} />
                  <NumPicker label="Decision-makers per company" options={PER_COMPANY_OPTIONS} value={maxPerCompany} onChange={setMaxPerCompany} />
                </div>

                <div>
                  <label className="text-xs font-semibold mb-1.5 block">Signal type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSignalMode("industry")}
                      className={cn(
                        "p-3 rounded-lg border text-left text-xs transition-colors",
                        signalMode === "industry" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                      )}
                    >
                      <div className="font-semibold mb-0.5">Industry signal</div>
                      <div className="text-muted-foreground">Fast, generic per-industry signal</div>
                    </button>
                    <button
                      onClick={() => setSignalMode("ai")}
                      className={cn(
                        "p-3 rounded-lg border text-left text-xs transition-colors",
                        signalMode === "ai" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                      )}
                    >
                      <div className="font-semibold mb-0.5 flex items-center gap-1"><Sparkles className="w-3 h-3" /> AI signal</div>
                      <div className="text-muted-foreground">Personalized per-lead sentence</div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold mb-1.5 block">Destination list</label>
                  <select
                    value={listChoice}
                    onChange={(e) => setListChoice(e.target.value)}
                    className="w-full text-xs border border-border rounded-lg px-3 py-2 bg-background"
                  >
                    <option value="__new__">+ Create new list</option>
                    {lists.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                  {listChoice === "__new__" && (
                    <Input
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      placeholder="List name"
                      className="mt-2 text-xs"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div className="space-y-3">
                <SummaryRow label="Seed companies" value={`${urls.length} compan${urls.length === 1 ? "y" : "ies"}`} />
                <SummaryRow label="Industries" value={industries.length ? industries.join(", ") : "Auto-detect from seeds"} />
                <SummaryRow label="Company size" value={companySizes.length ? companySizes.join(", ") : "Any"} />
                <SummaryRow label="Locations" value={locations.length ? locations.join(", ") : "Any"} />
                <SummaryRow label="Seniority" value={seniorities.join(", ") || "Any"} />
                <SummaryRow label="Functions" value={functions.length ? functions.join(", ") : "Any"} />
                <SummaryRow label="Max companies" value={String(maxCompanies)} />
                <SummaryRow label="Per company" value={String(maxPerCompany)} />
                <SummaryRow label="Signal mode" value={signalMode === "ai" ? "AI-generated" : "Industry-based"} />
                <SummaryRow label="Destination" value={listChoice === "__new__" ? newListName : lists.find((l) => l.id === listChoice)?.name || ""} />
                <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-xs">
                  <div className="font-semibold mb-0.5">Expected: up to {expected} leads</div>
                  <div className="text-muted-foreground">{maxCompanies} companies × {maxPerCompany} decision-maker{maxPerCompany === 1 ? "" : "s"} each</div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="ghost"
                onClick={() => step === 1 ? onOpenChange(false) : setStep(step - 1)}
              >
                {step === 1 ? "Cancel" : <><ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back</>}
              </Button>
              {step < 3 ? (
                <Button
                  onClick={() => setStep(step + 1)}
                  disabled={step === 1 && !urlsValid}
                >
                  Next <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} className="gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Find leads
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function MultiToggle({ label, options, values, onToggle }: { label: string; options: string[]; values: string[]; onToggle: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs font-semibold mb-1.5 block">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const active = values.includes(o);
          return (
            <button
              key={o}
              onClick={() => onToggle(o)}
              className={cn(
                "text-xs px-2.5 py-1.5 rounded-md border transition-colors",
                active ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:bg-muted/50"
              )}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function NumPicker({ label, options, value, onChange }: { label: string; options: number[]; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="text-xs font-semibold mb-1.5 block">{label}</label>
      <div className="flex gap-1.5">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onChange(o)}
            className={cn(
              "flex-1 text-xs py-1.5 rounded-md border transition-colors",
              value === o ? "border-primary bg-primary/10" : "border-border hover:bg-muted/50"
            )}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

function ChipField({ label, hint, values, input, setInput, onAdd, onRemove, placeholder }: { label: string; hint?: string; values: string[]; input: string; setInput: (v: string) => void; onAdd: () => void; onRemove: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="text-xs font-semibold mb-1 block">{label}</label>
      {hint && <div className="text-xs text-muted-foreground mb-1.5">{hint}</div>}
      <div className="flex gap-1.5">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onAdd(); } }}
          placeholder={placeholder}
          className="text-xs"
        />
        <Button variant="outline" size="sm" onClick={onAdd}>Add</Button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {values.map((v) => (
            <span key={v} className="text-xs bg-muted px-2 py-1 rounded-md flex items-center gap-1">
              {v}
              <button onClick={() => onRemove(v)} className="text-muted-foreground hover:text-foreground">×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-xs py-1.5 border-b border-border/60">
      <span className="text-muted-foreground font-medium">{label}</span>
      <span className="text-right text-foreground font-medium max-w-[60%]">{value}</span>
    </div>
  );
}

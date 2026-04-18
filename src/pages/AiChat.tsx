import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  Sparkles,
  RotateCcw,
  MapPin,
  TrendingUp,
  Lightbulb,
  Building2,
  GraduationCap,
  Briefcase,
  Paperclip,
  Mic,
  ArrowLeft,
  MessageSquare,
  Users,
  Linkedin,
  X,
  Filter,
  Clock,
  Heart,
  ThumbsDown,
  CheckCircle2,
  Search,
} from "lucide-react";
import { AnimateIn } from "@/hooks/useInView";
import {
  ChatMessage as ChatMessageType,
  SearchCriteria,
  ChatResponse,
  QuickReply,
  CandidateProfile,
  CandidateFilter,
} from "@/types/chat";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { SearchProgress } from "@/components/chat/SearchProgress";
import { ScrapingProgress, CandidateEnrichmentStatus } from "@/components/chat/ScrapingProgress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CandidateInsightCard } from "@/components/search/CandidateInsightCard";
import { TopNav } from "@/components/layout/TopNav";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type StatusFilter = "new" | "saved" | "skipped";

const FILTER_CHIPS = [
  { label: "Location", icon: MapPin, value: "location" },
  { label: "Experience", icon: TrendingUp, value: "experience" },
  { label: "Skills", icon: Lightbulb, value: "skills" },
  { label: "Industry", icon: Briefcase, value: "industry" },
  { label: "Company", icon: Building2, value: "company" },
  { label: "Education", icon: GraduationCap, value: "education" },
];

export default function SearchPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [criteria, setCriteria] = useState<SearchCriteria>({});
  const [candidates, setCandidates] = useState<CandidateProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentPositionId, setCurrentPositionId] = useState<string | null>(null);
  const [positionTitle, setPositionTitle] = useState<string | null>(null);
  const [initialInput, setInitialInput] = useState("");
  const [mobileView, setMobileView] = useState<"chat" | "candidates">("candidates");
  const [currentCandidateIndex, setCurrentCandidateIndex] = useState(0);
  const [processedCandidates, setProcessedCandidates] = useState<Set<string>>(new Set());
  const [analyzedCandidateIndices, setAnalyzedCandidateIndices] = useState<Set<number>>(new Set());
  const [analyzingCandidateIndices, setAnalyzingCandidateIndices] = useState<Set<number>>(new Set());
  const [pendingCriteria, setPendingCriteria] = useState<SearchCriteria | null>(null); // For keep/replace flow
  const [activeFilters, setActiveFilters] = useState<CandidateFilter[]>([]); // For filtering current candidate view
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("new"); // Tab filter for candidate status
  const [savedCandidateIds, setSavedCandidateIds] = useState<Set<string>>(new Set()); // Track saved candidates
  const [skippedCandidateIds, setSkippedCandidateIds] = useState<Set<string>>(new Set()); // Track skipped candidates
  const [isEnriching, setIsEnriching] = useState(false); // Track if we're enriching profiles
  const [enrichmentStatuses, setEnrichmentStatuses] = useState<CandidateEnrichmentStatus[]>([]); // Track per-candidate status
  const [enrichedCandidates, setEnrichedCandidates] = useState<CandidateProfile[]>([]); // Hold enriched candidates until all done
  const [selectedListCandidateIndex, setSelectedListCandidateIndex] = useState<number | null>(null); // For saved/skipped detail view
  const scrollRef = useRef<HTMLDivElement>(null);
  const initialFileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "there";
  const isInitialState = messages.length === 0;

  // Apply filters to candidates to get filtered list (including status filter)
  const filteredCandidates = useMemo(() => {
    // First, filter by status
    let filtered = candidates;

    // Status filter based on processedCandidates (skipped vs saved)
    // For now, we'll track status in a simple way:
    // - "new" = not in processedCandidates
    // - "saved" = in processedCandidates with "saved" action (we need to track this)
    // - "skipped" = in processedCandidates with "skipped" action

    // Note: We'll need to track saved vs skipped separately
    // For now, let's filter based on the status that's shown

    if (activeFilters.length === 0) return filtered;

    return filtered.filter((candidate) => {
      return activeFilters.every((filter) => {
        const { type, field, value } = filter;
        const valueLower = value.toLowerCase();

        let fieldValue = "";
        switch (field) {
          case "company":
            fieldValue = candidate.company?.toLowerCase() || "";
            const hasCompanyMatch =
              fieldValue.includes(valueLower) ||
              candidate.careerHistory?.some((job) => job.company?.toLowerCase().includes(valueLower));
            return type === "include" ? hasCompanyMatch : !hasCompanyMatch;

          case "location":
            fieldValue = candidate.location?.toLowerCase() || "";
            const hasLocationMatch = fieldValue.includes(valueLower);
            return type === "include" ? hasLocationMatch : !hasLocationMatch;

          case "skill":
            const hasSkillMatch = candidate.relevantSkills?.some((skill) => skill.toLowerCase().includes(valueLower));
            return type === "include" ? hasSkillMatch : !hasSkillMatch;

          case "title":
            fieldValue = candidate.title?.toLowerCase() || "";
            const hasTitleMatch = fieldValue.includes(valueLower);
            return type === "include" ? hasTitleMatch : !hasTitleMatch;

          case "experience":
            const expMatch = value.match(/(\d+)\+?/);
            if (expMatch) {
              const minYears = parseInt(expMatch[1]);
              const candidateYears = parseInt(candidate.totalExperience) || 0;
              return type === "include" ? candidateYears >= minYears : candidateYears < minYears;
            }
            return true;

          default:
            return true;
        }
      });
    });
  }, [candidates, activeFilters]);

  // Helper to add a filter
  const addFilter = (filter: CandidateFilter) => {
    setActiveFilters((prev) => {
      // Avoid duplicate filters
      const exists = prev.some((f) => f.type === filter.type && f.field === filter.field && f.value === filter.value);
      if (exists) return prev;
      return [...prev, filter];
    });
    // Reset to first candidate when filter changes
    setCurrentCandidateIndex(0);
  };

  // Helper to remove a filter
  const removeFilter = (filter: CandidateFilter) => {
    setActiveFilters((prev) =>
      prev.filter((f) => !(f.type === filter.type && f.field === filter.field && f.value === filter.value)),
    );
    setCurrentCandidateIndex(0);
  };

  // Clear all filters
  const clearFilters = () => {
    setActiveFilters([]);
    setCurrentCandidateIndex(0);
  };

  // Single candidate analysis function - returns promise, doesn't set global state
  // positionId is passed explicitly to avoid stale closure issues
  const analyzeSingleCandidate = async (
    candidate: CandidateProfile,
    index: number,
    positionId?: string | null,
  ): Promise<boolean> => {
    const needsAnalysis = (candidate as any).needsAnalysis;
    const needsDetailedScrape = (candidate as any).needsDetailedScrape;

    if (!candidate || (!needsAnalysis && !needsDetailedScrape)) return false;

    // Use passed positionId or fall back to current state
    const effectivePositionId = positionId ?? currentPositionId;

    console.log(
      `[Analysis Queue] Starting analysis for candidate ${index + 1}: ${candidate.name}, positionId: ${effectivePositionId}`,
    );

    // Detect user language from recent chat messages
    const userMessages = messages.filter((m) => m.role === "user" && m.id !== "initial").map((m) => m.content);
    const userLanguageSample = userMessages.slice(-5).join(" ").substring(0, 300);

    try {
      const { data, error } = await supabase.functions.invoke("analyze-candidate", {
        body: {
          candidate,
          criteria,
          userLanguageSample,
        },
      });

      if (error) {
        console.error(`[Analysis Queue] Error analyzing candidate ${index + 1}:`, error);
        return false;
      }

      if (data?.success && data?.candidate) {
        // Update the candidate in the list with the analyzed data
        setCandidates((prev) => {
          const updated = [...prev];
          if (updated[index]) {
            updated[index] = {
              ...updated[index],
              ...data.candidate,
              id: updated[index].id,
              linkedInUrl: updated[index].linkedInUrl || data.candidate.linkedInUrl,
              needsAnalysis: false,
              needsDetailedScrape: false,
            };
          }
          return updated;
        });

        // Also update in database if we have a position
        // Use linkedin_url for matching since candidate.id is a temporary search ID, not a database UUID
        const linkedInUrl = candidate.linkedInUrl || data.candidate?.linkedInUrl;
        if (effectivePositionId && user?.id && linkedInUrl) {
          console.log(`[Analysis Queue] Saving to DB for candidate ${candidate.name}, linkedInUrl: ${linkedInUrl}`);
          const { data: updateData, error: updateError } = await supabase
            .from("candidates")
            .update({
              ai_insights: data.candidate,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", user.id)
            .eq("position_id", effectivePositionId)
            .eq("linkedin_url", linkedInUrl)
            .select();

          if (updateError) {
            console.error(`[Analysis Queue] DB update error for ${candidate.name}:`, updateError);
          } else if (!updateData || updateData.length === 0) {
            console.error(`[Analysis Queue] DB update returned no rows for ${candidate.name} (url: ${linkedInUrl})`);
          } else {
            console.log(`[Analysis Queue] DB updated successfully for ${candidate.name}, rows: ${updateData.length}`);
          }
        } else {
          console.warn(
            `[Analysis Queue] Skipping DB update - missing: positionId=${effectivePositionId}, userId=${user?.id}, linkedInUrl=${linkedInUrl}`,
          );
        }

        console.log(`[Analysis Queue] Candidate ${index + 1} analyzed successfully: ${candidate.name}`);
        return true;
      }
      return false;
    } catch (err) {
      console.error(`[Analysis Queue] Failed to analyze candidate ${index + 1}:`, err);
      return false;
    }
  };

  // Analyze a candidate by index (with tracking)
  const analyzeCandidate = async (index: number, positionId?: string | null) => {
    const candidateList = candidates;
    if (index < 0 || index >= candidateList.length) return;

    const candidate = candidateList[index];
    if (!candidate) return;

    // Skip if already analyzed or currently analyzing
    if (analyzedCandidateIndices.has(index) || analyzingCandidateIndices.has(index)) {
      console.log(
        `[Analysis Queue] Skipping candidate ${index + 1} - already ${analyzedCandidateIndices.has(index) ? "analyzed" : "analyzing"}`,
      );
      return;
    }

    // Mark as analyzing
    setAnalyzingCandidateIndices((prev) => new Set([...prev, index]));

    const success = await analyzeSingleCandidate(candidate, index, positionId);

    // Mark as analyzed (regardless of success to prevent retries)
    setAnalyzedCandidateIndices((prev) => new Set([...prev, index]));
    setAnalyzingCandidateIndices((prev) => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
  };

  // Sequential analysis: first candidate priority, then all others in background
  const startSequentialAnalysis = async (candidateList: CandidateProfile[], positionId: string) => {
    if (candidateList.length === 0) return;

    console.log(
      "[Analysis Queue] Starting full analysis for",
      candidateList.length,
      "candidates, positionId:",
      positionId,
    );

    // Step 1: Analyze first candidate immediately (priority for instant feedback)
    const firstCandidate = candidateList[0];
    if (firstCandidate && ((firstCandidate as any).needsAnalysis || (firstCandidate as any).needsDetailedScrape)) {
      setAnalyzingCandidateIndices((prev) => new Set([...prev, 0]));
      const success = await analyzeSingleCandidate(firstCandidate, 0, positionId);
      setAnalyzedCandidateIndices((prev) => new Set([...prev, 0]));
      setAnalyzingCandidateIndices((prev) => {
        const newSet = new Set(prev);
        newSet.delete(0);
        return newSet;
      });
      console.log("[Analysis Queue] First candidate analysis complete");
    }

    // Step 2: Start background analysis for ALL remaining candidates (non-blocking)
    const remainingCandidates = candidateList.slice(1);
    if (remainingCandidates.length > 0) {
      console.log(
        `[Analysis Queue] Starting background analysis for ${remainingCandidates.length} remaining candidates`,
      );

      // Process in batches of 3 to avoid overwhelming the API
      const batchSize = 3;
      analyzeRemainingCandidates(remainingCandidates, positionId, 1, batchSize);
    }
  };

  // Background analysis for all remaining candidates (non-blocking, runs in background)
  const analyzeRemainingCandidates = async (
    remainingList: CandidateProfile[],
    positionId: string,
    startOffset: number,
    batchSize: number,
  ) => {
    for (let batchStart = 0; batchStart < remainingList.length; batchStart += batchSize) {
      const batch = remainingList.slice(batchStart, batchStart + batchSize);
      const batchIndices = batch.map((_, i) => startOffset + batchStart + i);

      console.log(`[Background Analysis] Processing batch: indices ${batchIndices.join(", ")}`);

      // Mark as analyzing
      setAnalyzingCandidateIndices((prev) => new Set([...prev, ...batchIndices]));

      // Start batch in parallel
      const promises = batch.map((candidate, i) => {
        const actualIndex = startOffset + batchStart + i;
        if ((candidate as any).needsAnalysis || (candidate as any).needsDetailedScrape) {
          return analyzeSingleCandidate(candidate, actualIndex, positionId).then((success) => ({
            index: actualIndex,
            success,
          }));
        }
        return Promise.resolve({ index: actualIndex, success: false });
      });

      // Wait for batch to complete
      const results = await Promise.all(promises);

      // Mark as analyzed
      setAnalyzedCandidateIndices((prev) => new Set([...prev, ...batchIndices]));
      setAnalyzingCandidateIndices((prev) => {
        const newSet = new Set(prev);
        batchIndices.forEach((i) => newSet.delete(i));
        return newSet;
      });

      console.log(`[Background Analysis] Batch complete:`, results.map((r) => `${r.index}: ${r.success}`).join(", "));

      // Small delay between batches to be gentle on the API
      if (batchStart + batchSize < remainingList.length) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    console.log("[Background Analysis] All candidates analyzed");
  };

  // Sequential analysis with offset for when adding to existing candidates
  const startSequentialAnalysisWithOffset = async (
    candidateList: CandidateProfile[],
    positionId: string,
    offset: number,
  ) => {
    if (candidateList.length === 0) return;

    console.log(
      "[Analysis Queue] Starting sequential analysis with offset",
      offset,
      "for",
      candidateList.length,
      "new candidates",
    );

    // Step 1: Analyze first new candidate immediately (priority)
    const firstCandidate = candidateList[0];
    const firstIndex = offset;
    if (firstCandidate && ((firstCandidate as any).needsAnalysis || (firstCandidate as any).needsDetailedScrape)) {
      setAnalyzingCandidateIndices((prev) => new Set([...prev, firstIndex]));
      const success = await analyzeSingleCandidate(firstCandidate, firstIndex, positionId);
      setAnalyzedCandidateIndices((prev) => new Set([...prev, firstIndex]));
      setAnalyzingCandidateIndices((prev) => {
        const newSet = new Set(prev);
        newSet.delete(firstIndex);
        return newSet;
      });
      console.log("[Analysis Queue] First new candidate analysis complete");
    }

    // Step 2: Analyze next 4 candidates in parallel (if they exist)
    const nextBatch = candidateList.slice(1, 5);
    if (nextBatch.length > 0) {
      console.log(
        `[Analysis Queue] Starting parallel analysis for new candidates ${offset + 2}-${offset + 1 + nextBatch.length}`,
      );

      // Mark all as analyzing (with offset)
      const batchIndices = nextBatch.map((_, i) => offset + i + 1);
      setAnalyzingCandidateIndices((prev) => new Set([...prev, ...batchIndices]));

      // Start all analyses in parallel
      const promises = nextBatch.map((candidate, i) => {
        const actualIndex = offset + i + 1;
        if ((candidate as any).needsAnalysis || (candidate as any).needsDetailedScrape) {
          return analyzeSingleCandidate(candidate, actualIndex, positionId).then((success) => ({
            index: actualIndex,
            success,
          }));
        }
        return Promise.resolve({ index: actualIndex, success: false });
      });

      // Wait for all to complete
      const results = await Promise.all(promises);

      // Mark all as analyzed
      setAnalyzedCandidateIndices((prev) => new Set([...prev, ...batchIndices]));
      setAnalyzingCandidateIndices((prev) => {
        const newSet = new Set(prev);
        batchIndices.forEach((i) => newSet.delete(i));
        return newSet;
      });

      console.log("[Analysis Queue] New batch analysis complete:", results);
    }
  };

  // Analyze more candidates when user navigates (analyze 2 more beyond last analyzed)
  const analyzeAheadCandidates = async (currentIndex: number, positionId?: string | null) => {
    // Find the highest analyzed index
    const maxAnalyzed = Math.max(...analyzedCandidateIndices, currentIndex);

    // Analyze 2 more candidates beyond the max
    const nextIndices = [maxAnalyzed + 1, maxAnalyzed + 2].filter(
      (i) => i < candidates.length && !analyzedCandidateIndices.has(i) && !analyzingCandidateIndices.has(i),
    );

    if (nextIndices.length > 0) {
      console.log(`[Analysis Queue] Analyzing ahead: candidates ${nextIndices.map((i) => i + 1).join(", ")}`);

      // Mark as analyzing
      setAnalyzingCandidateIndices((prev) => new Set([...prev, ...nextIndices]));

      // Start in parallel
      const promises = nextIndices.map((index) => {
        const candidate = candidates[index];
        if (candidate && ((candidate as any).needsAnalysis || (candidate as any).needsDetailedScrape)) {
          return analyzeSingleCandidate(candidate, index, positionId).then((success) => ({ index, success }));
        }
        return Promise.resolve({ index, success: false });
      });

      await Promise.all(promises);

      // Mark as analyzed
      setAnalyzedCandidateIndices((prev) => new Set([...prev, ...nextIndices]));
      setAnalyzingCandidateIndices((prev) => {
        const newSet = new Set(prev);
        nextIndices.forEach((i) => newSet.delete(i));
        return newSet;
      });
    }
  };

  // Trigger analysis when user navigates to a new candidate
  useEffect(() => {
    if (candidates.length === 0) return;

    const currentCandidate = candidates[currentCandidateIndex];
    if (!currentCandidate) return;

    // If current candidate needs analysis and isn't being analyzed, analyze it
    const needsWork = (currentCandidate as any).needsAnalysis || (currentCandidate as any).needsDetailedScrape;
    if (
      needsWork &&
      !analyzedCandidateIndices.has(currentCandidateIndex) &&
      !analyzingCandidateIndices.has(currentCandidateIndex)
    ) {
      analyzeCandidate(currentCandidateIndex);
    }

    // Also trigger ahead analysis when navigating
    if (currentCandidateIndex > 0) {
      analyzeAheadCandidates(currentCandidateIndex);
    }
  }, [currentCandidateIndex]);

  // Load position from URL params
  useEffect(() => {
    const positionId = searchParams.get("position");
    if (positionId && !currentPositionId) {
      loadPosition(positionId);
    }
  }, [searchParams]);

  const loadPosition = async (positionId: string) => {
    try {
      // Load position details, chat messages, and candidates in parallel
      const [positionResult, messagesResult, candidatesResult] = await Promise.all([
        supabase.from("positions").select("*").eq("id", positionId).single(),
        supabase
          .from("chat_messages")
          .select("*")
          .eq("position_id", positionId)
          .order("created_at", { ascending: true }),
        supabase.from("candidates").select("*").eq("position_id", positionId).order("created_at", { ascending: true }),
      ]);

      if (positionResult.error) throw positionResult.error;
      const position = positionResult.data;

      if (position) {
        setCurrentPositionId(position.id);
        setPositionTitle(position.title);

        // Restore full criteria from position (including languages, skills, etc.)
        const storedCriteria = position.criteria as SearchCriteria | null;
        setCriteria(
          storedCriteria || {
            role: position.title,
            location: position.location || undefined,
          },
        );
        console.log(
          "[Load] Restored criteria:",
          storedCriteria || { role: position.title, location: position.location },
        );

        // Load chat messages
        if (messagesResult.error) {
          console.error("Error loading chat messages:", messagesResult.error);
        }

        if (messagesResult.data && messagesResult.data.length > 0) {
          const loadedMessages: ChatMessageType[] = messagesResult.data.map((msg: any) => ({
            id: msg.id,
            role: msg.role as "user" | "assistant",
            content: msg.content,
            timestamp: new Date(msg.created_at),
            quickReplies: msg.quick_replies,
            attachment: msg.attachment,
          }));
          setMessages(loadedMessages);
        } else {
          // No history - show welcome back message
          const welcomeMessage: ChatMessageType = {
            id: "welcome-back",
            role: "assistant",
            content: `Welcome back! You're continuing your search for **${position.title}**${position.location ? ` in ${position.location}` : ""}. How can I help you refine the search or find more candidates?`,
            timestamp: new Date(),
            quickReplies: [
              { label: "Find more candidates", value: "START", description: "Search for more matches" },
              { label: "Refine criteria", value: "refine", description: "Adjust search parameters" },
            ],
          };
          setMessages([welcomeMessage]);
        }

        // Load candidates from database
        if (candidatesResult.error) {
          console.error("Error loading candidates:", candidatesResult.error);
        }

        if (candidatesResult.data && candidatesResult.data.length > 0) {
          console.log("Loaded candidates from database:", candidatesResult.data.length);

          // Track saved/skipped from DB status
          const loadedSavedIds = new Set<string>();
          const loadedSkippedIds = new Set<string>();

          // Convert DB candidates to CandidateProfile format
          const alreadyAnalyzedIndices: number[] = [];
          const loadedCandidates: CandidateProfile[] = candidatesResult.data.map((dbCandidate: any, index: number) => {
            const insights = dbCandidate.ai_insights || {};

            // Track status from DB
            if (dbCandidate.status === "saved") loadedSavedIds.add(dbCandidate.id);
            if (dbCandidate.status === "skipped") loadedSkippedIds.add(dbCandidate.id);

            // Check if this candidate already has REAL AI analysis
            const hasRealInsights =
              insights.insights && Array.isArray(insights.insights) && insights.insights.length > 1;

            const hasRealCareerHistory =
              insights.careerHistory &&
              Array.isArray(insights.careerHistory) &&
              insights.careerHistory.length > 0 &&
              insights.careerHistory.some(
                (job: any) => job.company && job.company !== "Company" && job.company.trim() !== "",
              );

            const hasRealExperience =
              insights.totalExperience && insights.totalExperience !== "? Years" && insights.totalExperience !== "?";

            const alreadyAnalyzed = hasRealInsights || hasRealCareerHistory || hasRealExperience;

            if (alreadyAnalyzed) {
              alreadyAnalyzedIndices.push(index);
            }

            return {
              id: dbCandidate.id,
              name: dbCandidate.name,
              title: dbCandidate.title || "",
              company: dbCandidate.company || "",
              companyBadgeColor: getCompanyColor(index),
              location: dbCandidate.location || "",
              linkedInUrl: dbCandidate.linkedin_url || "",
              hasContactInfo: Boolean(dbCandidate.linkedin_url),
              avatar: dbCandidate.avatar,
              moveLikelihood: insights.moveLikelihood || 50,
              moveReasons: insights.moveReasons || ["Profile Under Review"],
              moveConfidence: insights.moveConfidence || "low",
              moveSignals: insights.moveSignals || [],
              alignmentScore: insights.alignmentScore || "partially-aligned",
              alignmentIndicators: insights.alignmentIndicators || 3,
              overallMatchScore: insights.overallMatchScore || undefined,
              overallVerdict: insights.overallVerdict || undefined,
              overallOneLiner: insights.overallOneLiner || undefined,
              summary: insights.summary || undefined,
              insights: insights.insights || [
                { title: "Profile Found", description: "Found on LinkedIn", status: "verified" as const },
              ],
              relevantSkills: insights.relevantSkills || [],
              companyBackground: insights.companyBackground || [],
              totalExperience: insights.totalExperience || "?",
              relevantExperience: insights.relevantExperience || "N/A",
              averageTenure: insights.averageTenure || "N/A",
              careerHistory: insights.careerHistory || [],
              education: insights.education || [],
              needsAnalysis: !alreadyAnalyzed,
              needsDetailedScrape: !alreadyAnalyzed,
            };
          });

          console.log(
            "Candidates loaded:",
            loadedCandidates.length,
            "| saved:",
            loadedSavedIds.size,
            "| skipped:",
            loadedSkippedIds.size,
          );

          setCandidates(loadedCandidates);
          setSavedCandidateIds(loadedSavedIds);
          setSkippedCandidateIds(loadedSkippedIds);
          setProcessedCandidates(new Set([...loadedSavedIds, ...loadedSkippedIds]));
          setCurrentCandidateIndex(0);
          setAnalyzedCandidateIndices(new Set(alreadyAnalyzedIndices));
          setAnalyzingCandidateIndices(new Set());
        } else {
          // Fall back to extracting candidates from chat message attachments
          const candidatesFromMessages: CandidateProfile[] = [];
          for (const msg of messagesResult.data || []) {
            const attachment = msg.attachment as { type?: string; data?: CandidateProfile[] } | null;
            if (attachment && attachment.type === "candidates" && Array.isArray(attachment.data)) {
              candidatesFromMessages.push(...attachment.data);
            }
          }

          if (candidatesFromMessages.length > 0) {
            console.log("Restored candidates from chat history:", candidatesFromMessages.length);
            setCandidates(candidatesFromMessages);
            setCurrentCandidateIndex(0);
            setProcessedCandidates(new Set());
            setAnalyzedCandidateIndices(new Set());
            setAnalyzingCandidateIndices(new Set());
          }
        }
      }
    } catch (error) {
      console.error("Error loading position:", error);
      toast({
        title: "Error",
        description: "Could not load the position. Starting fresh.",
        variant: "destructive",
      });
    }
  };

  // Helper function to save a message to the database
  const saveMessage = async (
    positionId: string,
    role: "user" | "assistant",
    content: string,
    quickReplies?: any[],
    attachment?: any,
  ) => {
    if (!user?.id) return;

    try {
      await supabase.from("chat_messages").insert({
        position_id: positionId,
        user_id: user.id,
        role,
        content,
        quick_replies: quickReplies || null,
        attachment: attachment || null,
      });
    } catch (error) {
      console.error("Error saving message:", error);
    }
  };

  // Auto-scroll to bottom when messages change or on mount
  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (viewport) {
        requestAnimationFrame(() => {
          viewport.scrollTop = viewport.scrollHeight;
        });
      }
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, isSearching, scrollToBottom]);

  // Also scroll on initial mount after messages load
  useEffect(() => {
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [scrollToBottom]);

  // Helper function to read file as base64 or text
  const readFileContent = async (file: File): Promise<{ content: string; isBase64: boolean }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      if (file.type.startsWith("image/") || file.type === "application/pdf") {
        // Read as base64 for images and PDFs
        reader.onload = () => {
          const result = reader.result as string;
          // Extract base64 data after the data URL prefix
          const base64 = result.split(",")[1];
          resolve({ content: base64, isBase64: true });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      } else {
        // Read as text for text files
        reader.onload = () => {
          resolve({ content: reader.result as string, isBase64: false });
        };
        reader.onerror = reject;
        reader.readAsText(file);
      }
    });
  };

  // Helper function to parse document and extract job requirements
  const parseDocument = async (file: File): Promise<{ summary: string; criteria: SearchCriteria } | null> => {
    try {
      const { content, isBase64 } = await readFileContent(file);

      const { data, error } = await supabase.functions.invoke("parse-document", {
        body: {
          fileContent: content,
          fileType: file.type,
          fileName: file.name,
        },
      });

      if (error) {
        console.error("Document parsing error:", error);
        return null;
      }

      if (data?.success && data?.data) {
        return {
          summary: data.data.summary || "",
          criteria: data.data.criteria || {},
        };
      }

      return null;
    } catch (error) {
      console.error("Error parsing document:", error);
      return null;
    }
  };

  const sendMessage = async (content: string, file?: File) => {
    if (!content.trim() && !file) return;

    // Check if this is a direct search trigger (quick reply with START value)
    const isSearchTrigger = ["START", "view_results", "Start searching"].includes(content.trim());

    // Create user message
    const userMessage: ChatMessageType = {
      id: Date.now().toString(),
      role: "user",
      content: file ? content || `Uploaded: ${file.name}` : content,
      timestamp: new Date(),
      attachment: file ? { type: "file", name: file.name } : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Save user message if we have a position
    if (currentPositionId) {
      await saveMessage(
        currentPositionId,
        "user",
        file ? content || `Uploaded: ${file.name}` : content,
        undefined,
        file ? { type: "file", name: file.name } : undefined,
      );
    }

    // If this is a search trigger and we have criteria, start search directly
    if (isSearchTrigger && criteria.role) {
      setIsLoading(false);

      // Create position if doesn't exist
      let positionId = currentPositionId;
      if (!positionId && user?.id) {
        const positionTitle = `${criteria.role}${criteria.location ? ` - ${criteria.location}` : ""}`;
        const { data: newPosition, error: positionError } = await supabase
          .from("positions")
          .insert([
            {
              user_id: user.id,
              title: positionTitle,
              location: criteria.location || null,
              status: "active",
              criteria: JSON.parse(JSON.stringify(criteria)),
            },
          ])
          .select()
          .single();

        if (!positionError && newPosition) {
          positionId = newPosition.id;
          setCurrentPositionId(positionId);
          setPositionTitle(positionTitle);

          // Save all previous messages to the new position
          for (const msg of messages) {
            if (msg.id !== "initial" && msg.id !== "welcome-back") {
              await saveMessage(positionId, msg.role, msg.content, msg.quickReplies, msg.attachment);
            }
          }
        }
      }

      setIsSearching(true);

      // Add a starting message
      const startingMessage: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Starting the search for **${criteria.role}**${criteria.location ? ` in ${criteria.location}` : ""}...`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, startingMessage]);

      if (positionId) {
        await saveMessage(positionId, "assistant", startingMessage.content);
      }

      await performSearch(positionId);
      return;
    }

    let documentContent = "";
    let extractedCriteria: SearchCriteria = {};

    try {
      // If a file is uploaded, parse it first
      if (file) {
        toast({
          title: "Processing document",
          description: `Analyzing ${file.name}...`,
        });

        const parsedDoc = await parseDocument(file);

        if (parsedDoc) {
          documentContent = parsedDoc.summary;
          extractedCriteria = parsedDoc.criteria;

          // Update criteria with extracted info
          setCriteria((prev) => ({ ...prev, ...extractedCriteria }));

          toast({
            title: "Document analyzed",
            description: "Job requirements extracted successfully!",
          });
        } else {
          toast({
            title: "Warning",
            description: "Could not extract details from document. Proceeding with conversation.",
            variant: "destructive",
          });
        }
      }

      // Build conversation history for the API
      const conversationHistory = messages
        .filter((m) => m.id !== "initial" && m.id !== "welcome-back")
        .map((m) => ({
          role: m.role,
          content: m.attachment?.name ? `[Uploaded file: ${m.attachment.name}]\n${m.content}` : m.content,
        }));

      // Add current message with document context if available
      let messageContent = content;
      if (file && documentContent) {
        messageContent = `[Uploaded job description: ${file.name}]\n\nExtracted requirements:\n${documentContent}\n\nExtracted criteria: ${JSON.stringify(extractedCriteria)}\n\n${content ? `User comment: ${content}` : "Please analyze this job description and help me find matching candidates."}`;
      } else if (file) {
        messageContent = `[Uploaded file: ${file.name}]\n${content || "Please help me with this document."}`;
      }

      conversationHistory.push({
        role: "user",
        content: messageContent,
      });

      const { data, error } = await supabase.functions.invoke<ChatResponse>("recruiter-chat", {
        body: {
          messages: conversationHistory,
          currentCriteria: { ...criteria, ...extractedCriteria },
          hasCandidates: candidates.length > 0,
          activeFilters: activeFilters,
        },
      });

      if (error) throw error;

      if (data) {
        // Update criteria if provided
        const updatedCriteria = data.criteria ? { ...criteria, ...data.criteria } : criteria;
        if (data.criteria) {
          setCriteria(updatedCriteria);
        }

        // Create assistant message
        const assistantMessage: ChatMessageType = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.message,
          timestamp: new Date(),
          quickReplies: data.quick_replies,
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // Handle search action - create position first, then search
        if (data.action === "search") {
          // Create the position with AI-generated title
          const positionTitle = data.position_title || criteria.role || "New position";
          let positionId = currentPositionId;

          if (!positionId && user?.id) {
            const { data: newPosition, error: positionError } = await supabase
              .from("positions")
              .insert([
                {
                  user_id: user.id,
                  title: positionTitle,
                  location: criteria.location || null,
                  status: "active",
                  criteria: JSON.parse(JSON.stringify(updatedCriteria)),
                },
              ])
              .select()
              .single();

            if (positionError) {
              console.error("Error creating position:", positionError);
              toast({
                title: "Error",
                description: "Failed to create position. Search will continue.",
                variant: "destructive",
              });
            } else if (newPosition) {
              positionId = newPosition.id;
              setCurrentPositionId(positionId);
              toast({
                title: "Position Created",
                description: `"${positionTitle}" has been added to your positions.`,
              });

              // Save all previous messages to the new position
              for (const msg of messages) {
                if (msg.id !== "initial" && msg.id !== "welcome-back") {
                  await saveMessage(positionId, msg.role, msg.content, msg.quickReplies, msg.attachment);
                }
              }
              // Save the current user message
              await saveMessage(
                positionId,
                "user",
                content,
                undefined,
                file ? { type: "file", name: file.name } : undefined,
              );
            }
          }

          // Save assistant message
          if (positionId) {
            await saveMessage(positionId, "assistant", data.message, data.quick_replies);
          }

          // Show search progress UI (no message needed, the SearchProgress component will show)
          setIsSearching(true);

          // Perform the actual search
          await performSearch(positionId, false, updatedCriteria);
        } else if (data.action === "ask_keep_replace") {
          // Store the pending criteria for when user chooses keep or replace
          if (data.criteria) {
            setPendingCriteria({ ...criteria, ...data.criteria });
          }
          // Save assistant message
          if (currentPositionId) {
            await saveMessage(currentPositionId, "assistant", data.message, data.quick_replies);
          }
        } else if (data.action === "filter_results") {
          // Apply filters to current candidate view
          if (data.filters && data.filters.length > 0) {
            data.filters.forEach((filter) => addFilter(filter));
            toast({
              title: "Filter applied",
              description: `Showing ${filteredCandidates.length} of ${candidates.length} candidates`,
            });
          }
          // Save assistant message
          if (currentPositionId) {
            await saveMessage(currentPositionId, "assistant", data.message, data.quick_replies);
          }
        } else if (data.action === "clear_filters") {
          // Clear all active filters
          clearFilters();
          toast({
            title: "Filters cleared",
            description: `Showing all ${candidates.length} candidates`,
          });
          // Save assistant message
          if (currentPositionId) {
            await saveMessage(currentPositionId, "assistant", data.message, data.quick_replies);
          }
        } else if (currentPositionId) {
          // Not a search action, but we have a position - save the assistant message
          await saveMessage(currentPositionId, "assistant", data.message, data.quick_replies);
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: "Failed to get response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Enrich a single candidate and return the enriched data
  const enrichSingleCandidate = async (
    candidate: CandidateProfile,
    index: number,
    updateStatus: (status: CandidateEnrichmentStatus["status"]) => void,
    criteriaOverride?: SearchCriteria,
  ): Promise<CandidateProfile> => {
    const needsAnalysis = (candidate as any).needsAnalysis;
    const needsDetailedScrape = (candidate as any).needsDetailedScrape;

    if (!needsAnalysis && !needsDetailedScrape) {
      updateStatus("complete");
      return candidate;
    }

    try {
      // Update status to scraping
      updateStatus("scraping");

      // Detect user language from recent chat messages
      const userMessages = messages.filter((m) => m.role === "user" && m.id !== "initial").map((m) => m.content);
      const userLanguageSample = userMessages.slice(-5).join(" ").substring(0, 300);

      const { data, error } = await supabase.functions.invoke("analyze-candidate", {
        body: {
          candidate,
          criteria: criteriaOverride || criteria,
          userLanguageSample,
        },
      });

      if (error) {
        console.error(`[Enrichment] Error enriching candidate ${index + 1}:`, error);
        updateStatus("failed");
        return { ...candidate, needsAnalysis: false, needsDetailedScrape: false };
      }

      // Update status to analyzing (AI insights)
      updateStatus("analyzing");

      // Small delay to show the analyzing state
      await new Promise((r) => setTimeout(r, 500));

      if (data?.success && data?.candidate) {
        updateStatus("complete");
        return {
          ...candidate,
          ...data.candidate,
          id: candidate.id,
          linkedInUrl: candidate.linkedInUrl || data.candidate.linkedInUrl,
          needsAnalysis: false,
          needsDetailedScrape: false,
        };
      }

      updateStatus("failed");
      return { ...candidate, needsAnalysis: false, needsDetailedScrape: false };
    } catch (err) {
      console.error(`[Enrichment] Failed to enrich candidate ${index + 1}:`, err);
      updateStatus("failed");
      return { ...candidate, needsAnalysis: false, needsDetailedScrape: false };
    }
  };

  // Enrich all candidates and wait for completion
  const enrichAllCandidates = async (
    rawCandidates: CandidateProfile[],
    effectivePositionId: string,
    criteriaOverride?: SearchCriteria,
  ): Promise<CandidateProfile[]> => {
    console.log("[Enrichment] Starting enrichment for", rawCandidates.length, "candidates");

    // Initialize enrichment statuses
    const initialStatuses: CandidateEnrichmentStatus[] = rawCandidates.map((c, i) => ({
      id: c.id,
      name: c.name,
      status: "pending" as const,
    }));
    setEnrichmentStatuses(initialStatuses);
    setIsEnriching(true);

    const enrichedResults: CandidateProfile[] = [];

    // Process candidates sequentially for better UX (shows progress one by one)
    for (let i = 0; i < rawCandidates.length; i++) {
      const candidate = rawCandidates[i];

      const updateStatus = (status: CandidateEnrichmentStatus["status"]) => {
        setEnrichmentStatuses((prev) => prev.map((s, idx) => (idx === i ? { ...s, status } : s)));
      };

      const enriched = await enrichSingleCandidate(candidate, i, updateStatus, criteriaOverride);
      enrichedResults.push(enriched);

      // Update in database as we go
      const linkedInUrl = candidate.linkedInUrl || enriched.linkedInUrl;
      if (user?.id && effectivePositionId && linkedInUrl) {
        await supabase
          .from("candidates")
          .update({
            ai_insights: JSON.parse(JSON.stringify(enriched)),
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .eq("position_id", effectivePositionId)
          .eq("linkedin_url", linkedInUrl);
      }
    }

    console.log("[Enrichment] All candidates enriched");

    // Small delay to show completion state
    await new Promise((r) => setTimeout(r, 800));

    setIsEnriching(false);
    return enrichedResults;
  };

  const performSearch = async (
    positionIdOverride?: string,
    keepExisting: boolean = false,
    criteriaOverride?: SearchCriteria,
  ) => {
    const effectivePositionId = positionIdOverride || currentPositionId;
    // Use the passed criteria override to avoid stale React state closure issues
    const effectiveCriteria = criteriaOverride || criteria;
    try {
      // ALWAYS check database for existing candidates to exclude duplicates
      // This prevents re-finding the same candidates on any search path
      let existingLinkedInUrls: string[] = [];
      if (user?.id && effectivePositionId) {
        const { data: existingCandidates } = await supabase
          .from("candidates")
          .select("linkedin_url")
          .eq("user_id", user.id)
          .eq("position_id", effectivePositionId)
          .not("linkedin_url", "is", null);

        existingLinkedInUrls = (existingCandidates || []).map((c) => c.linkedin_url).filter(Boolean) as string[];

        if (existingLinkedInUrls.length > 0) {
          console.log(`[Search] Found ${existingLinkedInUrls.length} existing candidate URLs to exclude from database`);
          // If we found existing candidates in DB, force keepExisting to true
          // so we append results instead of replacing
          keepExisting = true;
        }
      }

      console.log(
        "Starting search with criteria:",
        effectiveCriteria,
        "positionId:",
        effectivePositionId,
        "keepExisting:",
        keepExisting,
        "excluding:",
        existingLinkedInUrls.length,
        "existing candidates",
      );

      // Call the real search-candidates edge function
      const { data, error } = await supabase.functions.invoke("search-candidates", {
        body: { criteria: effectiveCriteria, excludeLinkedInUrls: existingLinkedInUrls },
      });

      if (error) {
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || "Search failed");
      }

      console.log("Search results:", data);

      // Transform the results to match CandidateProfile type
      const searchBatchId = Date.now();
      const rawResults: CandidateProfile[] = (data.candidates || []).map((candidate: any, index: number) => ({
        id: `search-${searchBatchId}-${index}`,
        name: candidate.name || "Unknown",
        title: candidate.title || candidate.current_role || effectiveCriteria.role || "Professional",
        company: candidate.company || candidate.current_company || "Company",
        companyBadgeColor: getCompanyColor(index),
        location: candidate.location || effectiveCriteria.location || "Location not specified",
        linkedInUrl: candidate.linkedInUrl || "",
        hasContactInfo: Boolean(candidate.linkedInUrl),
        moveLikelihood: candidate.moveLikelihood || 50,
        moveReasons: candidate.moveReasons || ["Profile Under Review"],
        alignmentScore: candidate.alignmentScore || "partially-aligned",
        alignmentIndicators: candidate.alignmentIndicators || 3,
        insights: candidate.insights || [
          {
            title: "Profile Found",
            description: `Found on LinkedIn matching your search criteria.`,
            status: "verified" as const,
          },
        ],
        relevantSkills: candidate.relevantSkills || candidate.skills || [],
        companyBackground: candidate.companyBackground || [],
        totalExperience: candidate.totalExperience || `${candidate.experience_years || "?"} Years`,
        relevantExperience: candidate.relevantExperience || "N/A",
        averageTenure: candidate.averageTenure || "N/A",
        careerHistory:
          candidate.careerHistory ||
          (candidate.current_company
            ? [
                {
                  company: candidate.current_company || candidate.company,
                  title: candidate.current_role || candidate.title,
                  period: "Current",
                  duration: "Present",
                  isCurrent: true,
                },
              ]
            : []),
        education: candidate.education
          ? Array.isArray(candidate.education)
            ? candidate.education
            : [
                {
                  institution: candidate.education,
                  degree: "",
                  period: "",
                },
              ]
          : [],
        needsAnalysis: candidate.needsAnalysis ?? true,
        needsDetailedScrape: candidate.needsDetailedScrape ?? true,
      }));

      // End the "searching" phase, start "enriching" phase
      setIsSearching(false);

      if (rawResults.length === 0) {
        // No results - show message immediately
        const resultsMessage: ChatMessageType = {
          id: (Date.now() + 3).toString(),
          role: "assistant",
          content: `I couldn't find candidates matching your criteria. Try broadening your search or adjusting the requirements.`,
          timestamp: new Date(),
          quickReplies: [
            { label: "Refine search", value: "refine", description: "Add more filters" },
            { label: "New search", value: "new_search", description: "Start over" },
          ],
        };
        setMessages((prev) => [...prev, resultsMessage]);
        return;
      }

      // Save raw candidates to database first
      if (user?.id && effectivePositionId) {
        await saveCandidatesToDatabase(rawResults, effectivePositionId);
      }

      // NOW enrich all candidates (this will show progress bar)
      const enrichedResults = await enrichAllCandidates(rawResults, effectivePositionId || "", effectiveCriteria);

      // Only NOW show candidates to the user
      if (keepExisting) {
        setCandidates((prev) => [...prev, ...enrichedResults]);
        // Reset index to show the first unreviewed candidate
        setCurrentCandidateIndex(0);
      } else {
        setCandidates(enrichedResults);
        setCurrentCandidateIndex(0);
        setProcessedCandidates(new Set());
        setAnalyzedCandidateIndices(new Set());
        setAnalyzingCandidateIndices(new Set());
        // Mark all as analyzed since we enriched them already
        setAnalyzedCandidateIndices(new Set(enrichedResults.map((_, i) => i)));
      }

      // Add results message - different wording for keep scenario
      const totalCount = keepExisting ? candidates.length + enrichedResults.length : enrichedResults.length;
      const resultsMessage: ChatMessageType = {
        id: (Date.now() + 3).toString(),
        role: "assistant",
        content: keepExisting
          ? `Added **${enrichedResults.length} new matches**! You now have **${totalCount} candidates** total. Review each candidate below.`
          : `Found **${enrichedResults.length} matches**! Review each candidate below. Click "Add To Outreach" to save or "Skip" to move to the next.`,
        timestamp: new Date(),
        attachment: { type: "candidates", data: enrichedResults },
        quickReplies: [
          { label: "Refine search", value: "refine", description: "Add more filters" },
          { label: "New search", value: "new_search", description: "Start over" },
        ],
      };

      setMessages((prev) => [...prev, resultsMessage]);

      // Save results message with candidates to database
      if (effectivePositionId) {
        await saveMessage(effectivePositionId, "assistant", resultsMessage.content, resultsMessage.quickReplies, {
          type: "candidates",
          data: enrichedResults,
        });
      }
    } catch (error) {
      console.error("Search error:", error);
      setIsSearching(false);
      setIsEnriching(false);

      const errorMessage: ChatMessageType = {
        id: (Date.now() + 3).toString(),
        role: "assistant",
        content: `Sorry, I encountered an error while searching: ${error instanceof Error ? error.message : "Unknown error"}. Please try again.`,
        timestamp: new Date(),
        quickReplies: [
          { label: "Try again", value: "START", description: "Retry the search" },
          { label: "New search", value: "new_search", description: "Start over" },
        ],
      };

      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  // Helper function to generate company badge colors
  const getCompanyColor = (index: number): string => {
    const colors = ["#E91E63", "#0070D2", "#A100FF", "#00BCD4", "#FF5722", "#4CAF50"];
    return colors[index % colors.length];
  };

  const handleQuickReply = async (value: string) => {
    if (value === "new_search") {
      handleNewSearch();
      return;
    }

    // Handle keep_candidates action
    if (value === "keep_candidates") {
      await handleKeepCandidates();
      return;
    }

    // Handle replace_candidates action
    if (value === "replace_candidates") {
      await handleReplaceCandidates();
      return;
    }

    sendMessage(value);
  };

  // Handle keeping existing candidates and adding more with new criteria
  const handleKeepCandidates = async () => {
    if (!pendingCriteria) {
      sendMessage("keep_candidates");
      return;
    }

    // Apply the new criteria
    setCriteria(pendingCriteria);

    // Add user message
    const userMessage: ChatMessageType = {
      id: Date.now().toString(),
      role: "user",
      content: "Keep current + find more",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    if (currentPositionId) {
      await saveMessage(currentPositionId, "user", "Keep current + find more");

      // Update position criteria
      await supabase
        .from("positions")
        .update({ criteria: JSON.parse(JSON.stringify(pendingCriteria)) })
        .eq("id", currentPositionId);
    }

    // Add assistant message
    const assistantMessage: ChatMessageType = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: `Great! I'll keep your **${candidates.length} existing candidates** and search for more matching the updated criteria...`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, assistantMessage]);

    if (currentPositionId) {
      await saveMessage(currentPositionId, "assistant", assistantMessage.content);
    }

    // Clear pending criteria and start search (which will ADD to existing candidates)
    setPendingCriteria(null);
    setIsSearching(true);
    await performSearch(currentPositionId, true, pendingCriteria); // pass criteria directly to avoid stale closure
  };

  // Handle replacing all candidates with new search
  const handleReplaceCandidates = async () => {
    if (!pendingCriteria) {
      sendMessage("replace_candidates");
      return;
    }

    // Apply the new criteria
    setCriteria(pendingCriteria);

    // Add user message
    const userMessage: ChatMessageType = {
      id: Date.now().toString(),
      role: "user",
      content: "Replace all candidates",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    if (currentPositionId && user?.id) {
      await saveMessage(currentPositionId, "user", "Replace all candidates");

      // Delete existing candidates for this position
      const { error: deleteError } = await supabase
        .from("candidates")
        .delete()
        .eq("position_id", currentPositionId)
        .eq("user_id", user.id);

      if (deleteError) {
        console.error("Error deleting existing candidates:", deleteError);
      }

      // Update position criteria
      await supabase
        .from("positions")
        .update({ criteria: JSON.parse(JSON.stringify(pendingCriteria)) })
        .eq("id", currentPositionId);
    }

    // Clear local candidates state
    setCandidates([]);
    setCurrentCandidateIndex(0);
    setProcessedCandidates(new Set());
    setAnalyzedCandidateIndices(new Set());
    setAnalyzingCandidateIndices(new Set());

    // Add assistant message
    const assistantMessage: ChatMessageType = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: `Starting fresh! Searching for candidates with the **new criteria**...`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, assistantMessage]);

    if (currentPositionId) {
      await saveMessage(currentPositionId, "assistant", assistantMessage.content);
    }

    // Clear pending criteria and start search
    setPendingCriteria(null);
    setIsSearching(true);
    await performSearch(currentPositionId, false, pendingCriteria); // pass criteria directly
  };

  const handleNewSearch = () => {
    setMessages([]);
    setCriteria({});
    setCandidates([]);
    setCurrentPositionId(null);
    setInitialInput("");
    setCurrentCandidateIndex(0);
    setProcessedCandidates(new Set());
    setAnalyzedCandidateIndices(new Set());
    setAnalyzingCandidateIndices(new Set());
    setPendingCriteria(null);
    setActiveFilters([]);
  };

  // Save candidates to database
  const saveCandidatesToDatabase = async (candidateList: CandidateProfile[], positionId: string) => {
    if (!user?.id) return;

    let savedCount = 0;
    for (const candidate of candidateList) {
      try {
        // Check if candidate already exists for this position (by linkedin URL)
        const { data: existing } = await supabase
          .from("candidates")
          .select("id")
          .eq("user_id", user.id)
          .eq("position_id", positionId)
          .eq("linkedin_url", candidate.linkedInUrl || "")
          .single();

        if (!existing) {
          await supabase.from("candidates").insert({
            user_id: user.id,
            position_id: positionId,
            name: candidate.name,
            title: candidate.title,
            company: candidate.company,
            location: candidate.location,
            linkedin_url: candidate.linkedInUrl || null,
            avatar: candidate.avatar || null,
            status: "new",
            // Store ALL data from Coresignal in ai_insights
            ai_insights: JSON.parse(
              JSON.stringify({
                // Core profile data
                moveLikelihood: candidate.moveLikelihood,
                moveReasons: candidate.moveReasons,
                alignmentScore: candidate.alignmentScore,
                alignmentIndicators: candidate.alignmentIndicators,
                insights: candidate.insights,
                relevantSkills: candidate.relevantSkills,
                companyBackground: candidate.companyBackground,
                totalExperience: candidate.totalExperience,
                totalExperienceMonths: (candidate as any).totalExperienceMonths || null,
                relevantExperience: candidate.relevantExperience,
                averageTenure: candidate.averageTenure,
                careerHistory: candidate.careerHistory,
                education: candidate.education,
                // Extended Coresignal data
                headline: (candidate as any).headline || "",
                generatedHeadline: (candidate as any).generatedHeadline || "",
                about: (candidate as any).about || "",
                skills: (candidate as any).skills || [],
                languages: (candidate as any).languages || [],
                certifications: (candidate as any).certifications || [],
                recommendations: (candidate as any).recommendations || [],
                profilePicture: (candidate as any).profilePicture || "",
                industry: (candidate as any).industry || "",
                connectionsCount: (candidate as any).connectionsCount || 0,
                recommendationsCount: (candidate as any).recommendationsCount || 0,
                followerCount: (candidate as any).followerCount || 0,
                // Structured location
                locationCountry: (candidate as any).locationCountry || "",
                locationCity: (candidate as any).locationCity || "",
                locationState: (candidate as any).locationState || "",
                locationRegions: (candidate as any).locationRegions || [],
                locationCountryIso2: (candidate as any).locationCountryIso2 || "",
                // Enriched metadata
                isWorking: (candidate as any).isWorking ?? null,
                isDecisionMaker: (candidate as any).isDecisionMaker ?? null,
                department: (candidate as any).department || "",
                managementLevel: (candidate as any).managementLevel || "",
                coresignalId: (candidate as any).coresignalId || null,
                publicProfileId: (candidate as any).publicProfileId || "",
              }),
            ),
          });
          savedCount++;
        }
      } catch (error) {
        console.error("Error saving candidate:", candidate.name, error);
      }
    }

    // Trigger background AI analysis for saved candidates
    if (savedCount > 0) {
      console.log("[Background Analysis] Triggering analysis for", savedCount, "new candidates");
      try {
        // Fire and forget - don't wait for response
        supabase.functions
          .invoke("analyze-candidates-background", {
            body: {
              position_id: positionId,
              user_id: user.id,
              criteria: criteria,
            },
          })
          .then(({ error }) => {
            if (error) {
              console.error("[Background Analysis] Failed to start:", error);
            } else {
              console.log("[Background Analysis] Started successfully");
            }
          });
      } catch (err) {
        console.error("[Background Analysis] Error invoking function:", err);
      }
    }
  };

  // Handle Skip - mark as skipped and move to next
  const handleSkipCandidate = async (candidateId: string) => {
    // Search in both filtered and all candidates
    const candidate =
      filteredCandidates.find((c) => c.id === candidateId) || candidates.find((c) => c.id === candidateId);
    if (!candidate || !user?.id || !currentPositionId) return;

    try {
      // Update in database
      await supabase
        .from("candidates")
        .update({ status: "skipped" })
        .eq("user_id", user.id)
        .eq("position_id", currentPositionId)
        .eq("linkedin_url", candidate.linkedInUrl || "");

      // Mark as processed and skipped
      setProcessedCandidates((prev) => new Set([...prev, candidateId]));
      setSkippedCandidateIds((prev) => new Set([...prev, candidateId]));

      // The "new" tab list shrinks automatically when a candidate is skipped,
      // so we only need to clamp the index if it would overshoot.
      // We compute the new list length after this skip.
      const newListLength = statusFilteredCandidates.filter((c) => c.id !== candidateId).length;
      if (newListLength === 0) {
        setCurrentCandidateIndex(0);
        toast({
          title: "All candidates reviewed",
          description:
            activeFilters.length > 0
              ? "You've reviewed all filtered candidates."
              : "You've reviewed all candidates in this search.",
        });
      } else if (currentCandidateIndex >= newListLength) {
        setCurrentCandidateIndex(newListLength - 1);
      }
      // Otherwise, keep the same index — the next candidate slides into this position.
    } catch (error) {
      console.error("Error skipping candidate:", error);
    }
  };

  // Handle Add to Outreach - save and move to next
  const handleAddToOutreach = async (candidateId: string) => {
    // Search in both filtered and all candidates
    const candidate =
      filteredCandidates.find((c) => c.id === candidateId) || candidates.find((c) => c.id === candidateId);
    if (!candidate || !user?.id || !currentPositionId) return;

    try {
      // Update in database
      await supabase
        .from("candidates")
        .update({
          status: "saved",
          saved_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("position_id", currentPositionId)
        .eq("linkedin_url", candidate.linkedInUrl || "");

      // Mark as processed and saved
      setProcessedCandidates((prev) => new Set([...prev, candidateId]));
      setSavedCandidateIds((prev) => new Set([...prev, candidateId]));

      toast({
        title: "Added to Outreach",
        description: `${candidate.name} has been added to your outreach list.`,
      });

      // The "new" tab list shrinks automatically when a candidate is saved,
      // so we only need to clamp the index if it would overshoot.
      const newListLength = statusFilteredCandidates.filter((c) => c.id !== candidateId).length;
      if (newListLength === 0) {
        setCurrentCandidateIndex(0);
        toast({
          title: "All candidates reviewed",
          description:
            activeFilters.length > 0
              ? "You've reviewed all filtered candidates."
              : "You've reviewed all candidates in this search.",
        });
      } else if (currentCandidateIndex >= newListLength) {
        setCurrentCandidateIndex(newListLength - 1);
      }
    } catch (error) {
      console.error("Error adding candidate to outreach:", error);
      toast({
        title: "Error",
        description: "Failed to save candidate. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Get candidates filtered by status tab
  const statusFilteredCandidates = useMemo(() => {
    switch (statusFilter) {
      case "new":
        return filteredCandidates.filter((c) => !savedCandidateIds.has(c.id) && !skippedCandidateIds.has(c.id));
      case "saved":
        return filteredCandidates.filter((c) => savedCandidateIds.has(c.id));
      case "skipped":
        return filteredCandidates.filter((c) => skippedCandidateIds.has(c.id));
      default:
        return filteredCandidates;
    }
  }, [filteredCandidates, statusFilter, savedCandidateIds, skippedCandidateIds]);

  // Counts for tabs
  const newCount = filteredCandidates.filter(
    (c) => !savedCandidateIds.has(c.id) && !skippedCandidateIds.has(c.id),
  ).length;
  const savedCount = savedCandidateIds.size;
  const skippedCount = skippedCandidateIds.size;

  // Get remaining candidates count (based on status filtered)
  const displayedCandidates = statusFilteredCandidates;
  const remainingCandidates = displayedCandidates.length - processedCandidates.size;
  const currentCandidate = displayedCandidates[currentCandidateIndex];

  const handleInitialSubmit = () => {
    if (!initialInput.trim()) return;
    sendMessage(initialInput);
    setInitialInput("");
  };

  const handleFilterClick = (filter: string) => {
    const prompts: Record<string, string> = {
      location: "I'm looking for candidates in ",
      experience: "I need someone with experience in ",
      skills: "I'm looking for candidates with skills in ",
      industry: "I'm looking for candidates from the ",
      company: "I'm looking for candidates who worked at ",
      education: "I need candidates with education in ",
    };
    setInitialInput(prompts[filter] || "");
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNav positionTitle={positionTitle} />

      {/* Initial State - Clean Landing */}
      {isInitialState ? (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] pt-16 px-4">
          <div className="w-full max-w-2xl">
            {/* Back Button */}
            <AnimateIn delay={0}>
              <button
                onClick={() => navigate("/dashboard")}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                <span className="text-sm font-medium">Back</span>
              </button>
            </AnimateIn>

            {/* Greeting */}
            <AnimateIn delay={50}>
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-primary flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">Hey {firstName}!</h1>
                </div>
                <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mb-2">
                  Let's find the right people.
                </h2>
                <p className="text-muted-foreground">
                  Tell me who you're looking for and I'll match you with the best talent.
                </p>
              </div>
            </AnimateIn>

            {/* Input Card */}
            <AnimateIn delay={150}>
              <div className="rounded-2xl shadow-lg border border-border/40 bg-card/80 backdrop-blur-xl p-4 mb-6">
                <textarea
                  value={initialInput}
                  onChange={(e) => setInitialInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleInitialSubmit();
                    }
                  }}
                  placeholder="Ask Perfect AI..."
                  className="w-full bg-transparent text-foreground placeholder:text-muted-foreground resize-none outline-none text-base min-h-[60px]"
                  rows={2}
                />
                <div className="flex items-center gap-2 mt-2">
                  <input
                    ref={initialFileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        sendMessage(initialInput || "", file);
                        setInitialInput("");
                        if (initialFileInputRef.current) {
                          initialFileInputRef.current.value = "";
                        }
                      }
                    }}
                    className="hidden"
                  />
                  <button
                    onClick={() => initialFileInputRef.current?.click()}
                    className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                    title="Upload job description (PDF, DOCX, TXT, JPG)"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                    <Mic className="w-5 h-5" />
                  </button>
                  <div className="flex-1" />
                  <button
                    onClick={handleInitialSubmit}
                    disabled={!initialInput.trim()}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-white transition-all duration-200 disabled:opacity-30 hover:opacity-90 shrink-0"
                    style={{ background: "linear-gradient(145deg, #1a1a2e 0%, #2d2d44 40%, #4a4a5a 100%)" }}
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </AnimateIn>

            {/* Filter Chips */}
            <AnimateIn delay={250}>
              <div className="flex flex-wrap gap-2 justify-center">
                {FILTER_CHIPS.map((chip) => (
                  <button
                    key={chip.value}
                    onClick={() => handleFilterClick(chip.value)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full border border-border/40 bg-card/60 backdrop-blur-sm hover:bg-card hover:border-border hover:scale-[1.03] transition-all duration-200 text-sm font-medium text-foreground"
                  >
                    <chip.icon className="w-4 h-4 text-muted-foreground" />
                    {chip.label}
                  </button>
                ))}
              </div>
            </AnimateIn>
          </div>
        </div>
      ) : candidates.length > 0 ? (
        /* Split View - Chat on Left, Candidates on Right */
        <div className="flex flex-col lg:flex-row h-screen pt-16">
          {/* Mobile Toggle Tabs */}
          <div className="lg:hidden flex border-b border-border bg-background">
            <button
              onClick={() => setMobileView("candidates")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                mobileView === "candidates"
                  ? "text-primary border-b-2 border-primary bg-primary/5"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users className="w-4 h-4" />
              Candidates ({candidates.length})
            </button>
            <button
              onClick={() => setMobileView("chat")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                mobileView === "chat"
                  ? "text-primary border-b-2 border-primary bg-primary/5"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Chat
            </button>
          </div>

          {/* Left Side - Chat (30% on desktop, full on mobile when selected) */}
          <div
            className={`${mobileView === "chat" ? "flex" : "hidden"} lg:flex w-full lg:w-[30%] flex-col border-r border-border/50 bg-card/60 backdrop-blur-sm`}
          >
            {/* Back Button */}
            <div className="px-4 py-3 border-b border-border bg-card">
              <button
                onClick={() => navigate("/dashboard")}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                <span className="text-sm font-medium">Back</span>
              </button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 px-4" ref={scrollRef}>
              <div className="py-4 space-y-4">
                {messages.map((message, index) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    onQuickReply={handleQuickReply}
                    isLatest={index === messages.length - 1 && !isLoading}
                  />
                ))}
                {isLoading && <TypingIndicator />}
                {isSearching && !isEnriching && <SearchProgress isSearching={isSearching} />}
                {isEnriching && (
                  <ScrapingProgress
                    candidates={enrichmentStatuses}
                    totalCount={enrichmentStatuses.length}
                    completedCount={
                      enrichmentStatuses.filter((s) => s.status === "complete" || s.status === "failed").length
                    }
                    isVisible={isEnriching}
                  />
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="px-4 py-3 border-t border-border">
              <ChatInput onSend={sendMessage} isLoading={isLoading} placeholder="Ask Perfect AI..." />
            </div>
          </div>

          {/* Right Side - Candidates (70% on desktop, full on mobile when selected) */}
          <div
            className={`${mobileView === "candidates" ? "flex" : "hidden"} lg:flex w-full lg:w-[70%] flex-col bg-muted/30 overflow-hidden`}
          >
            {/* Status Filter Tabs */}
            <div className="flex bg-card/80 backdrop-blur-sm border-b border-border/50">
              <button
                onClick={() => {
                  setStatusFilter("new");
                  setCurrentCandidateIndex(0);
                  setSelectedListCandidateIndex(null);
                }}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2",
                  statusFilter === "new"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <Clock className="w-4 h-4" />
                <span>To Review</span>
                {newCount > 0 && (
                  <span
                    className={cn(
                      "px-1.5 py-0.5 text-xs rounded-full font-semibold",
                      statusFilter === "new" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {newCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => {
                  setStatusFilter("saved");
                  setCurrentCandidateIndex(0);
                  setSelectedListCandidateIndex(null);
                }}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2",
                  statusFilter === "saved"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <Heart className="w-4 h-4" />
                <span>Saved</span>
                {savedCount > 0 && (
                  <span
                    className={cn(
                      "px-1.5 py-0.5 text-xs rounded-full font-semibold",
                      statusFilter === "saved" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {savedCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => {
                  setStatusFilter("skipped");
                  setCurrentCandidateIndex(0);
                  setSelectedListCandidateIndex(null);
                }}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2",
                  statusFilter === "skipped"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <ThumbsDown className="w-4 h-4" />
                <span>Skipped</span>
                {skippedCount > 0 && (
                  <span
                    className={cn(
                      "px-1.5 py-0.5 text-xs rounded-full font-semibold",
                      statusFilter === "skipped" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {skippedCount}
                  </span>
                )}
              </button>
              <div className="flex-1" />
              <div className="flex items-center gap-2 px-4">
                <button
                  onClick={handleNewSearch}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span className="hidden sm:inline">New Search</span>
                </button>
              </div>
            </div>

            {/* Candidates Content */}
            <ScrollArea className="flex-1 bg-background [&>[data-radix-scroll-area-viewport]]:!overflow-x-hidden">
              <div className="w-full overflow-hidden" style={{ maxWidth: "100%" }}>
                {/* List View for Saved/Skipped tabs */}
                {(statusFilter === "saved" || statusFilter === "skipped") && displayedCandidates.length > 0 ? (
                  selectedListCandidateIndex !== null && displayedCandidates[selectedListCandidateIndex] ? (
                    /* Detail view for selected candidate */
                    <CandidateInsightCard
                      key={displayedCandidates[selectedListCandidateIndex].id}
                      candidate={displayedCandidates[selectedListCandidateIndex]}
                      onSkip={handleSkipCandidate}
                      onAddToOutreach={handleAddToOutreach}
                      isAnalyzing={false}
                      candidateStatus={statusFilter}
                      onBack={() => setSelectedListCandidateIndex(null)}
                    />
                  ) : (
                    /* List view */
                    <div className="divide-y divide-border/60 w-full overflow-hidden">
                      {displayedCandidates.map((candidate, index) => {
                        // Extract a one-liner summary from AI insights
                        const topInsights =
                          candidate.insights
                            ?.filter((i) => i.status === "verified" || i.status === "likely")
                            .slice(0, 2) || [];
                        const verdict = candidate.summary || candidate.overallVerdict || candidate.overallOneLiner;

                        return (
                          <div
                            key={candidate.id}
                            className="group px-5 py-4 cursor-pointer transition-all duration-200 overflow-hidden border-l-2 border-transparent hover:border-l-primary"
                            onClick={() => setSelectedListCandidateIndex(index)}
                          >
                            <div className="flex items-start gap-4 w-full overflow-hidden">
                              {/* Avatar */}
                              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-sm font-semibold text-primary flex-shrink-0 mt-0.5 border border-primary/10">
                                {candidate.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()
                                  .slice(0, 2)}
                              </div>

                              {/* Main content */}
                              <div className="grow w-0 overflow-hidden">
                                {/* Header row */}
                                <div className="flex items-center gap-2 mb-0.5 min-w-0 overflow-hidden">
                                  <h4 className="font-semibold text-base text-foreground truncate shrink min-w-0">
                                    {candidate.name}
                                  </h4>
                                  {candidate.linkedInUrl && (
                                    <>
                                      <span className="text-muted-foreground/30 flex-shrink-0">·</span>
                                      <a
                                        href={candidate.linkedInUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="hover:opacity-80 flex-shrink-0"
                                      >
                                        <Linkedin className="w-4.5 h-4.5 text-[#0A66C2]" />
                                      </a>
                                    </>
                                  )}

                                  {/* Move Likelihood & Alignment - right side of name row */}
                                  <div className="flex items-center gap-3 ml-auto flex-shrink-0">
                                    {/* Move Likelihood Pill */}
                                    <div
                                      className={cn(
                                        "flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold tabular-nums",
                                        candidate.moveLikelihood >= 60
                                          ? "bg-success/10 text-success border-success/20"
                                          : candidate.moveLikelihood >= 35
                                            ? "bg-warning/10 text-warning border-warning/20"
                                            : "bg-muted/40 text-muted-foreground border-border",
                                      )}
                                    >
                                      <span
                                        className={cn(
                                          "w-1.5 h-1.5 rounded-full",
                                          candidate.moveLikelihood >= 60
                                            ? "bg-success"
                                            : candidate.moveLikelihood >= 35
                                              ? "bg-warning"
                                              : "bg-muted-foreground",
                                        )}
                                      />
                                      {candidate.moveLikelihood}%
                                    </div>

                                    <div className="w-px h-5 bg-border" />

                                    {/* Alignment Score */}
                                    {(() => {
                                      const score = candidate.overallMatchScore ?? candidate.moveLikelihood;
                                      const filled =
                                        score >= 80 ? 5 : score >= 60 ? 4 : score >= 40 ? 3 : score >= 20 ? 2 : 1;
                                      const color = score >= 60 ? "text-success" : "text-warning";
                                      const alignLabel =
                                        candidate.roleFit?.verdict ||
                                        (score >= 80
                                          ? "Perfect match"
                                          : score >= 60
                                            ? "Strong match"
                                            : score >= 40
                                              ? "Partial match"
                                              : "Weak match");
                                      return (
                                        <div className="flex items-center gap-1">
                                          <div className="flex items-center gap-0.5">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                              <div
                                                key={i}
                                                className={cn(
                                                  "w-4 h-4 rounded-full flex items-center justify-center",
                                                  i < filled
                                                    ? color === "text-success"
                                                      ? "bg-success"
                                                      : "bg-warning"
                                                    : "bg-muted-foreground/20",
                                                )}
                                              >
                                                <svg
                                                  className={cn(
                                                    "w-2.5 h-2.5",
                                                    i < filled ? "text-white" : "text-muted-foreground/40",
                                                  )}
                                                  viewBox="0 0 24 24"
                                                  fill="none"
                                                  stroke="currentColor"
                                                  strokeWidth="3"
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                >
                                                  <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                              </div>
                                            ))}
                                          </div>
                                          <span
                                            className={cn(
                                              "text-xs font-semibold ml-0.5 hidden group-hover:inline",
                                              color,
                                            )}
                                          >
                                            {alignLabel}
                                          </span>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                </div>

                                {/* Title & company */}
                                <p className="text-sm text-muted-foreground mb-1.5 truncate">
                                  {candidate.title}
                                  {candidate.company &&
                                    candidate.company !== "Company" &&
                                    candidate.company !== "Unknown" && (
                                      <>
                                        {" "}
                                        <span className="text-muted-foreground/40 mx-0.5">|</span>{" "}
                                        <span className="font-medium text-foreground/80">{candidate.company}</span>
                                      </>
                                    )}
                                </p>

                                {/* Meta row: location, experience */}
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  {candidate.location && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/60 rounded-full px-2 py-0.5">
                                      <MapPin className="w-3 h-3 flex-shrink-0" />
                                      <span>{candidate.location}</span>
                                    </div>
                                  )}
                                  {candidate.totalExperience && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/60 rounded-full px-2 py-0.5">
                                      <Briefcase className="w-3 h-3 flex-shrink-0" />
                                      <span>{candidate.totalExperience}</span>
                                    </div>
                                  )}
                                  {candidate.careerTrajectory?.pattern && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/60 rounded-full px-2 py-0.5">
                                      <TrendingUp className="w-3 h-3 flex-shrink-0" />
                                      <span>{candidate.careerTrajectory.pattern}</span>
                                    </div>
                                  )}
                                </div>

                                {/* AI Summary */}
                                {verdict && (
                                  <p className="text-xs text-muted-foreground leading-relaxed mb-2 line-clamp-2 border-l-2 border-primary/30 pl-2">
                                    <Sparkles className="w-3 h-3 inline-block mr-1 text-primary/60 -mt-px" />
                                    {verdict}
                                  </p>
                                )}

                                {/* Key insights pills */}
                                {topInsights.length > 0 && !verdict && (
                                  <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                                    {topInsights.map((insight, i) => (
                                      <span
                                        key={i}
                                        className={cn(
                                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-medium",
                                          insight.status === "verified"
                                            ? "bg-success/10 text-success"
                                            : "bg-info/10 text-info",
                                        )}
                                      >
                                        {insight.status === "verified" ? "✓" : "~"} {insight.title}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Skills - full width below */}
                            {candidate.relevantSkills && candidate.relevantSkills.length > 0 && (
                              <div className="flex items-center gap-1.5 flex-wrap mt-3 pl-15">
                                {candidate.relevantSkills.slice(0, 5).map((skill, i) => (
                                  <span
                                    key={i}
                                    className={cn(
                                      "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border",
                                      i < 2
                                        ? "bg-primary/[0.08] text-primary border-primary/15"
                                        : "bg-muted/80 text-muted-foreground border-border/50",
                                    )}
                                  >
                                    {skill}
                                  </span>
                                ))}
                                {candidate.relevantSkills.length > 5 && (
                                  <span className="text-[10px] text-muted-foreground/60">
                                    +{candidate.relevantSkills.length - 5}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )
                ) : displayedCandidates.length > 0 && currentCandidate ? (
                  /* Single Card View for To Review tab */
                  <CandidateInsightCard
                    key={currentCandidate.id}
                    candidate={currentCandidate}
                    onSkip={handleSkipCandidate}
                    onAddToOutreach={handleAddToOutreach}
                    isAnalyzing={analyzingCandidateIndices.has(currentCandidateIndex)}
                  />
                ) : statusFilter !== "new" ? (
                  <div className="flex flex-col items-center justify-center py-20 px-6">
                    <div
                      className={cn(
                        "w-20 h-20 rounded-2xl flex items-center justify-center mb-6 border",
                        statusFilter === "saved"
                          ? "bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200/50"
                          : "bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200/50",
                      )}
                    >
                      {statusFilter === "saved" ? (
                        <Heart className="w-9 h-9 text-emerald-500" />
                      ) : (
                        <ThumbsDown className="w-9 h-9 text-amber-500" />
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">No {statusFilter} candidates yet</h3>
                    <p className="text-sm text-muted-foreground text-center max-w-xs leading-relaxed">
                      {statusFilter === "saved"
                        ? "Candidates you add to outreach will appear here."
                        : "Candidates you skip will appear here for later review."}
                    </p>
                  </div>
                ) : activeFilters.length > 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 px-6">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-muted/50 to-muted border border-border/50 flex items-center justify-center mb-6">
                      <Filter className="w-9 h-9 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">No matches for these filters</h3>
                    <p className="text-sm text-muted-foreground mb-6 text-center max-w-xs leading-relaxed">
                      Try adjusting or clearing your filters to see more candidates.
                    </p>
                    <button
                      onClick={clearFilters}
                      className="px-5 py-2.5 bg-secondary text-secondary-foreground rounded-xl hover:bg-secondary/80 transition-colors text-sm font-medium"
                    >
                      Clear Filters
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 px-6">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200/50 flex items-center justify-center mb-6">
                      <CheckCircle2 className="w-9 h-9 text-emerald-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">All caught up!</h3>
                    <p className="text-sm text-muted-foreground mb-6 text-center max-w-xs leading-relaxed">
                      You've reviewed every candidate in this search. Ready to discover more talent?
                    </p>
                    <Button
                      onClick={() => sendMessage("Please find me more candidates that match the same criterias")}
                      className="gap-2 rounded-xl"
                    >
                      <Sparkles className="w-4 h-4" />
                      Expand Search
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      ) : (
        /* Chat State - No Candidates Yet */
        <div className="flex flex-col h-[calc(100vh-4rem)] pt-16">
          {/* Back Button */}
          <div className="px-3 sm:px-6 py-3">
            <div className="max-w-3xl mx-auto">
              <button
                onClick={() => navigate("/dashboard")}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                <span className="text-sm font-medium">Back</span>
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <ScrollArea className="flex-1 px-3 sm:px-6" ref={scrollRef}>
            <div className="max-w-3xl mx-auto py-4 sm:py-6 space-y-4 sm:space-y-6">
              {messages.map((message, index) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  onQuickReply={handleQuickReply}
                  isLatest={index === messages.length - 1 && !isLoading}
                />
              ))}
              {isLoading && <TypingIndicator />}
              {isSearching && <SearchProgress isSearching={isSearching} />}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="px-3 sm:px-6 py-3 sm:py-4">
            <div className="max-w-3xl mx-auto">
              <ChatInput onSend={sendMessage} isLoading={isLoading} placeholder="Tell me who you're looking for..." />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api-client";
import { Check, Plus, Sparkles, ChevronDown, Loader2, Database, BookOpen, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TopicItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  order: number;
  published: boolean;
  _count?: { patterns: number };
}

interface TopicFillInputProps {
  topics: TopicItem[];
  selectedTopicId: string;
  typedTopicName: string;
  onChange: (topicId: string, topicName: string) => void;
  onTopicCreated?: (newTopic: TopicItem) => void;
  onError?: (msg: string) => void;
  onSuccess?: (msg: string) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
}

export function TopicFillInput({
  topics,
  selectedTopicId,
  typedTopicName,
  onChange,
  onTopicCreated,
  onError,
  onSuccess,
  label = "Curriculum Topic / Track",
  required = true,
  disabled = false,
}: TopicFillInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isSavingTopic, setIsSavingTopic] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync internal input value with props
  useEffect(() => {
    if (selectedTopicId) {
      const match = topics.find((t) => t.id === selectedTopicId);
      if (match) {
        setInputValue(match.name);
        return;
      }
    }
    if (typedTopicName) {
      setInputValue(typedTopicName);
    } else {
      setInputValue("");
    }
  }, [selectedTopicId, typedTopicName, topics]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredTopics = topics.filter((t) =>
    t.name.toLowerCase().includes(inputValue.trim().toLowerCase())
  );

  const exactMatch = topics.find(
    (t) => t.name.trim().toLowerCase() === inputValue.trim().toLowerCase()
  );

  const isExistingTopic = Boolean(
    (selectedTopicId && topics.some((t) => t.id === selectedTopicId)) || exactMatch
  );

  const matchedTopic = exactMatch || topics.find((t) => t.id === selectedTopicId);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    setIsOpen(true);
    setHighlightedIndex(-1);

    const match = topics.find((t) => t.name.trim().toLowerCase() === val.trim().toLowerCase());
    if (match) {
      onChange(match.id, match.name);
    } else {
      // It's a typed new topic name (no existing topicId yet)
      onChange("", val);
    }
  };

  const handleSelectTopic = (topic: TopicItem) => {
    setInputValue(topic.name);
    onChange(topic.id, topic.name);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleSaveTopicToDatabase = async (nameToSave?: string) => {
    const topicName = (nameToSave || inputValue).trim();
    if (!topicName) return;

    // Check if already in DB
    const existing = topics.find(
      (t) => t.name.trim().toLowerCase() === topicName.toLowerCase()
    );
    if (existing) {
      handleSelectTopic(existing);
      onSuccess?.(`Topic "${existing.name}" is already in the database!`);
      return;
    }

    setIsSavingTopic(true);
    try {
      const maxOrder = topics.reduce((max, t) => Math.max(max, t.order || 0), 0);
      const res = await apiClient<TopicItem>("/admin/topics", {
        method: "POST",
        body: JSON.stringify({
          name: topicName,
          order: maxOrder + 1,
          published: true,
          icon: "Target",
        }),
      });

      if (res.success && res.data) {
        onTopicCreated?.(res.data);
        handleSelectTopic(res.data);
        onSuccess?.(`Topic "${res.data.name}" saved to database successfully!`);
      } else {
        onError?.(res.error?.message || "Failed to save topic to database");
      }
    } catch (err: any) {
      onError?.(err?.message || "Failed to save topic to database");
    } finally {
      setIsSavingTopic(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      setHighlightedIndex((prev) =>
        prev < filteredTopics.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      if (isOpen && highlightedIndex >= 0 && filteredTopics[highlightedIndex]) {
        e.preventDefault();
        handleSelectTopic(filteredTopics[highlightedIndex]);
      } else if (inputValue.trim() && !exactMatch && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    setInputValue("");
    onChange("", "");
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-1.5" ref={containerRef}>
      <div className="flex items-center justify-between">
        <label className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
          <BookOpen className="h-3.5 w-3.5 text-primary" />
          <span>{label}</span>
          {required && <span className="text-destructive">*</span>}
        </label>

        {/* Database Status Indicator */}
        {inputValue.trim() && (
          <div>
            {isExistingTopic ? (
              <Badge
                variant="outline"
                className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 flex items-center gap-1 py-0 h-4.5"
              >
                <Check className="h-2.5 w-2.5" />
                <span>Saved in DB</span>
                {matchedTopic?.order !== undefined && (
                  <span className="opacity-75">#{matchedTopic.order}</span>
                )}
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="text-[10px] bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20 flex items-center gap-1 py-0 h-4.5 animate-pulse"
              >
                <Sparkles className="h-2.5 w-2.5" />
                <span>New Topic (Auto-save to DB)</span>
              </Badge>
            )}
          </div>
        )}
      </div>

      <div className="relative">
        <div className="relative flex items-center">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Type or select a curriculum track (e.g. Sliding Window, Dynamic Programming)..."
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            required={required}
            className="h-9 pr-16 text-xs text-foreground bg-background"
          />

          <div className="absolute right-1.5 flex items-center gap-1">
            {inputValue && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 cursor-pointer"
                title="Clear topic"
              >
                <X className="h-3 w-3" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsOpen((prev) => !prev)}
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 cursor-pointer"
              tabIndex={-1}
            >
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition-transform duration-150",
                  isOpen && "rotate-180"
                )}
              />
            </button>
          </div>
        </div>

        {/* Action button below input if user typed a new topic and wants to persist to DB instantly */}
        {inputValue.trim() && !isExistingTopic && (
          <div className="pt-1.5 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1 text-sky-600 dark:text-sky-400">
              <Database className="h-3 w-3" />
              Will auto-save &quot;{inputValue.trim()}&quot; to database on pattern submit.
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isSavingTopic}
              onClick={() => handleSaveTopicToDatabase()}
              className="h-6 px-2 text-[10px] gap-1 border-sky-500/30 text-sky-600 dark:text-sky-400 hover:bg-sky-500/10 cursor-pointer"
            >
              {isSavingTopic ? (
                <Loader2 className="h-2.5 w-2.5 animate-spin" />
              ) : (
                <Plus className="h-2.5 w-2.5" />
              )}
              <span>Save Topic to DB Now</span>
            </Button>
          </div>
        )}

        {/* Autocomplete Dropdown List */}
        {isOpen && (
          <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover shadow-xl max-h-56 overflow-y-auto p-1 animate-in fade-in duration-100">
            {/* If user typed a new topic name not yet in DB, show instant Create option */}
            {inputValue.trim() && !exactMatch && (
              <button
                type="button"
                onClick={() => handleSaveTopicToDatabase()}
                disabled={isSavingTopic}
                className="w-full text-left p-2 rounded-md hover:bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-between gap-2 text-xs transition-colors cursor-pointer border-b border-border/50 mb-1"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-5 w-5 rounded bg-sky-500/20 flex items-center justify-center shrink-0">
                    {isSavingTopic ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Plus className="h-3 w-3" />
                    )}
                  </div>
                  <div className="truncate">
                    <span className="font-semibold">Create &amp; Save: </span>
                    <span className="italic font-medium">&quot;{inputValue.trim()}&quot;</span>
                  </div>
                </div>
                <Badge variant="outline" className="text-[9px] border-sky-500/30 shrink-0">
                  Save to DB
                </Badge>
              </button>
            )}

            {/* List of existing DB topics matching search */}
            {filteredTopics.length > 0 ? (
              <div className="space-y-0.5">
                <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Existing Curriculum Tracks ({filteredTopics.length})
                </div>
                {filteredTopics.map((t, idx) => {
                  const isSelected = selectedTopicId === t.id || exactMatch?.id === t.id;
                  const isHighlighted = highlightedIndex === idx;

                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleSelectTopic(t)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      className={cn(
                        "w-full text-left px-2.5 py-1.5 rounded-md flex items-center justify-between gap-2 text-xs transition-colors cursor-pointer",
                        isSelected
                          ? "bg-primary/10 text-primary font-semibold"
                          : isHighlighted
                          ? "bg-muted text-foreground"
                          : "text-foreground hover:bg-muted/70"
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                          #{t.order}
                        </span>
                        <span className="truncate">{t.name}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {t._count?.patterns !== undefined && (
                          <span className="text-[10px] text-muted-foreground">
                            {t._count.patterns} pats
                          </span>
                        )}
                        {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : !inputValue.trim() ? (
              <div className="p-3 text-center text-xs text-muted-foreground">
                No curriculum topics in database. Type a topic name above to create one.
              </div>
            ) : (
              <div className="px-2.5 py-2 text-xs text-muted-foreground">
                No existing topic matching &quot;{inputValue}&quot;. You can use it as a new topic!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

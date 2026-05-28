"use client";

import Link from "next/link";
import { ArrowRight, Bookmark, LayoutGrid, List } from "lucide-react";
import { useState } from "react";

interface IdeaBoardProps {
  validations: any[];
}

export function IdeaBoard({ validations }: IdeaBoardProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  return (
    <div className="glass-light rounded-3xl p-8 border border-white/5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[80px] -z-10" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-accent/10 text-accent">
            <Bookmark className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold text-foreground">Founder Workspace</h3>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex bg-background-secondary rounded-lg p-1 border border-border">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-background text-primary shadow-sm" : "text-foreground-tertiary hover:text-foreground"}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-background text-primary shadow-sm" : "text-foreground-tertiary hover:text-foreground"}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          {validations.length > 0 && (
            <Link href="/history" className="text-sm font-semibold text-primary hover:text-primary-light transition-colors flex items-center">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          )}
        </div>
      </div>
      
      {validations.length === 0 ? (
        <div className="text-center py-12 bg-background-secondary/50 rounded-2xl border border-white/5 border-dashed">
          <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5 shadow-sm">
            <Bookmark className="w-6 h-6 text-foreground-tertiary" />
          </div>
          <h4 className="text-foreground font-semibold mb-1 text-lg">Your Workspace is Empty</h4>
          <p className="text-foreground-secondary text-sm mb-6 max-w-sm mx-auto">Validate your first startup idea to start building your portfolio of intelligent insights.</p>
          <Link href="/validate" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl gradient-primary text-white font-semibold transition-all hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:scale-[1.02]">
            Validate an Idea <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className={viewMode === "grid" ? "grid sm:grid-cols-2 gap-4" : "space-y-3"}>
          {validations.map((item: any) => (
            <Link 
              key={item.id} 
              href={`/validate/${item.id}`}
              className={`group block rounded-2xl bg-background-secondary/50 border border-white/5 hover:border-primary/40 hover:bg-background-secondary transition-all ${viewMode === "grid" ? "p-5" : "p-4"}`}
            >
              <div className={`flex ${viewMode === "grid" ? "flex-col gap-4" : "justify-between items-center gap-4"}`}>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary-light transition-colors">
                    {item.idea || "Untitled Idea"}
                  </h4>
                  <p className="text-xs text-foreground-tertiary mt-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-success"></span>
                    Analyzed on {new Date(item.createdAt).toLocaleDateString(undefined, { 
                      month: 'short', day: 'numeric', year: 'numeric' 
                    })}
                  </p>
                </div>
                <div className={`flex items-center justify-center w-10 h-10 rounded-full bg-background border border-white/10 group-hover:scale-110 transition-transform shadow-sm flex-shrink-0 ${viewMode === "grid" ? "self-end" : ""}`}>
                  <ArrowRight className="w-4 h-4 text-foreground-secondary group-hover:text-primary transition-colors" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

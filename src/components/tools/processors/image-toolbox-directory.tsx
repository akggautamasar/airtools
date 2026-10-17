"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Image as ImageIcon, ArrowUpRight, Info } from "lucide-react";
import type { Tool } from "@/types";
import {
 IMAGE_WORKBENCH_TOOLS,IMAGE_TOOLBOX_GROUPS,EXISTING_IMAGE_TOOLBOX_LINKS
} from "@/lib/image-workbench-presets";

const NOT_YET_AVAILABLE=[
 "Generative AI face creation","Automatic object/text/logo removal and background inpainting",
 "AI unblur and blemish restoration","Photos to MP4 and slideshow video rendering",
 "HEIC decoding on browsers without native HEIC support","Full EXIF/GPS metadata editing",
 "DOCX rendering to JPG","Fully automatic face detection and masking",
 "Arbitrary AVIF encoding on browsers without an AVIF encoder"
];
export default function ImageToolboxDirectory({tool:_tool}:{tool:Tool}) {
 const [search,setSearch]=useState("");
 const [onlyNew,setOnlyNew]=useState(false);
 const filter=search.trim().toLowerCase();
 const entries=useMemo(()=>
  IMAGE_TOOLBOX_GROUPS.map(group=>{
   const all=[
    ...IMAGE_WORKBENCH_TOOLS.filter(x=>x.group===group).map(x=>({slug:x.slug,name:x.name,description:x.description,newTool:true})),
    ...EXISTING_IMAGE_TOOLBOX_LINKS.filter(x=>x.group===group).map(x=>({slug:x.slug,name:x.name,description:"Existing AirTools tool",newTool:false}))
   ];
   return {group,items:all.filter(x=>(!onlyNew||x.newTool)&&(!filter||[x.name,x.description,x.slug,group].join(" ").toLowerCase().includes(filter)))};
  }).filter(x=>x.items.length>0)
 ,[filter,onlyNew]);
 const total=entries.reduce((sum,x)=>sum+x.items.length,0);
 return <div className="space-y-6">
   <section className="rounded-2xl border border-border bg-card p-5 space-y-3">
    <h2 className="text-2xl font-bold">Image Toolbox</h2>
    <p className="text-sm text-muted-foreground">
     Explore working image utilities in a searchable collection. Most operations run locally in your browser with
     no login or image upload to a server. Advanced existing tools may have their own processing requirements.
    </p>
    <label className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
     <Search className="h-5 w-5 text-muted-foreground"/>
     <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search image tools, sizes, effects, formats…"
      className="w-full border-none bg-transparent py-1 text-sm outline-none" aria-label="Search image toolbox"/>
    </label>
    <label className="flex items-center gap-2 text-xs text-muted-foreground">
     <input type="checkbox" checked={onlyNew} onChange={e=>setOnlyNew(e.target.checked)}/>
     Show only new image workbench tools
    </label>
    <p className="text-xs text-muted-foreground">{total} matching tool links across {entries.length} categories</p>
   </section>
   <nav className="flex flex-wrap gap-2" aria-label="Jump to a group">
    {entries.map(({group})=><a key={group} href={"#toolbox-"+group.toLowerCase().replace(/[^a-z0-9]+/g,"-")}
      className="rounded-full border border-border px-3 py-1.5 text-xs hover:border-primary hover:text-primary">{group}</a>)}
   </nav>
   {entries.map(({group,items})=><section key={group} id={"toolbox-"+group.toLowerCase().replace(/[^a-z0-9]+/g,"-")}
    className="scroll-mt-24 rounded-2xl border border-border bg-card p-4 sm:p-5">
    <div className="mb-4 flex items-center gap-3">
     <ImageIcon className="h-5 w-5 text-primary"/><h3 className="text-lg font-bold">{group}</h3>
     <span className="ml-auto rounded-lg bg-muted px-2 py-1 text-xs text-muted-foreground">{items.length} tools</span>
    </div>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
     {items.map((item,i)=><Link key={item.slug+"-"+i} href={"/tools/"+item.slug}
      className="group flex min-h-16 flex-col justify-center rounded-lg border border-border p-3 transition-colors hover:border-primary hover:bg-primary/5">
      <div className="flex items-start justify-between gap-1">
       <span className="text-xs font-semibold sm:text-sm">{item.name}</span>
       <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-primary"/>
      </div>
      <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{item.description}</p>
     </Link>)}
    </div>
   </section>)}
   {!entries.length&&<p className="rounded-xl border border-border p-6 text-center text-sm text-muted-foreground">No tools match this search.</p>}
   <section className="rounded-2xl border border-border bg-muted/20 p-5 space-y-3">
    <h3 className="flex items-center gap-2 font-semibold"><Info className="h-5 w-5"/>Features needing further integration</h3>
    <p className="text-sm text-muted-foreground">These screenshot examples are not advertised as working tools. They require specialized AI,
     video encoders or image decoders beyond this browser-based release:</p>
    <p className="text-xs leading-7 text-muted-foreground">{NOT_YET_AVAILABLE.join(" · ")}</p>
    <p className="text-xs text-muted-foreground">Existing AirTools background removal, OCR, GIF maker, and upscaler tools are linked above.
     A requested maximum KB is an attempt, not guaranteed when preserving pixel detail. Output metadata and compatibility vary by browser.</p>
   </section>
 </div>;
}

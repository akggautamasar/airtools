"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Download, WandSparkles, Layers, Eraser, Brush, Package, Image as ImageIcon, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UploadZone } from "@/components/tools/upload-zone";
import type { Tool, UploadedFile } from "@/types";
import { downloadBlob, formatFileSize } from "@/lib/utils";

type Mode = "transparent" | "solid" | "gradient" | "photo";
type OutputSize = "original" | "square" | "marketplace" | "portrait";
type Item = { id: string; name: string; original: File; cutout: Blob; url: string };
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject)=>{
    const image=new Image();
    image.onload=()=>resolve(image);
    image.onerror=()=>reject(new Error("Could not decode image"));
    image.src=url;
  });
}
function saveCanvas(canvas: HTMLCanvasElement): Promise<Blob>{
  return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error("PNG export failed")),"image/png"));
}
function safeName(name:string){return name.replace(/\.[^.]+$/,"").replace(/[^\w.-]+/g,"-").slice(0,75)||"product";}
async function composite(item: Item, mode: Mode, bgColor: string, gradient: string, backgroundUrl: string, size: OutputSize, zoom:number, shadow:number) {
  const source=await loadImage(item.url);
  let width=source.naturalWidth,height=source.naturalHeight;
  if(size==="square"){width=1080;height=1080;}
  if(size==="marketplace"){width=2000;height=2000;}
  if(size==="portrait"){width=1200;height=1500;}
  if(width*height>16000000){
    const factor=Math.sqrt(16000000/(width*height));width=Math.round(width*factor);height=Math.round(height*factor);
  }
  const canvas=document.createElement("canvas");canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext("2d");if(!ctx)throw Error("Canvas is unavailable");
  if(mode==="solid"){ctx.fillStyle=bgColor;ctx.fillRect(0,0,width,height);}
  if(mode==="gradient"){
    const gradients:Record<string,[string,string]>={
      studio:["#fafbff","#dce5f6"],sand:["#fff5df","#ddb892"],
      night:["#20283b","#596c83"],mint:["#f4fff7","#c8eedf"]
    };
    const colors=gradients[gradient]||gradients.studio;
    const fill=ctx.createLinearGradient(0,0,width,height);
    fill.addColorStop(0,colors[0]);fill.addColorStop(1,colors[1]);
    ctx.fillStyle=fill;ctx.fillRect(0,0,width,height);
  }
  if(mode==="photo"&&backgroundUrl){
    const bg=await loadImage(backgroundUrl);
    const scale=Math.max(width/bg.naturalWidth,height/bg.naturalHeight);
    ctx.drawImage(bg,(width-bg.naturalWidth*scale)/2,(height-bg.naturalHeight*scale)/2,bg.naturalWidth*scale,bg.naturalHeight*scale);
  }
  const factor=Math.min(width/source.naturalWidth,height/source.naturalHeight)*zoom;
  const w=source.naturalWidth*factor,h=source.naturalHeight*factor;
  const left=(width-w)/2,top=(height-h)/2;
  ctx.save();
  if(shadow>0 && mode!=="transparent"){
    ctx.shadowColor="rgba(0,0,0,0.38)";
    ctx.shadowBlur=shadow*width/1200;
    ctx.shadowOffsetY=shadow*width/1600;
  }
  ctx.drawImage(source,left,top,w,h);
  ctx.restore();
  return canvas;
}
export default function BackgroundStudio({ tool }: { tool: Tool }) {
  const [files,setFiles]=useState<UploadedFile[]>([]);
  const [items,setItems]=useState<Item[]>([]);
  const [selected,setSelected]=useState(0);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");
  const [mode,setMode]=useState<Mode>(tool.slug==="product-photo-maker"?"gradient":"transparent");
  const [bgColor,setBgColor]=useState("#ffffff");
  const [gradient,setGradient]=useState("studio");
  const [backgroundUrl,setBackgroundUrl]=useState("");
  const [size,setSize]=useState<OutputSize>(tool.slug==="product-photo-maker"?"marketplace":"original");
  const [scale,setScale]=useState(.9);
  const [shadow,setShadow]=useState(12);
  const [brushMode,setBrushMode]=useState<"erase"|"restore">("erase");
  const [brushSize,setBrushSize]=useState(22);
  const [brushOpen,setBrushOpen]=useState(false);
  const [paintDirty,setPaintDirty]=useState(false);
  const [stage,setStage]=useState("");
  const urls=useRef<string[]>([]);
  const previewRef=useRef<HTMLCanvasElement>(null);
  const brushRef=useRef<HTMLCanvasElement>(null);
  const drawingRef=useRef(false);
  const paintSourceRef=useRef<HTMLImageElement|null>(null);
  const selectedItem=items[selected]||null;
  const track=(url:string)=>{urls.current.push(url);return url;};
  useEffect(()=>()=>{urls.current.forEach(u=>URL.revokeObjectURL(u));},[]);
  const clear=()=>{
    setItems([]);setSelected(0);setError("");setMessage("");setBrushOpen(false);setPaintDirty(false);
  };
  const process=async()=>{
    if(busy||!files.length)return;
    setBusy(true);clear();setStage("Loading the on-device AI model");
    const completed:Item[]=[];
    try{
      const {removeBackground}=await import("@imgly/background-removal");
      for(let i=0;i<files.length;i++){
        const input=files[i];setStage("Removing background from "+(i+1)+" of "+files.length+" · "+input.name);
        try{
          const cutout=await removeBackground(input.file,{
            progress:(key,current,total)=>setMessage(key+" "+(total?Math.round(100*current/total):0)+"%")
          });
          const url=track(URL.createObjectURL(cutout));
          completed.push({id:input.id,name:input.name,original:input.file,cutout,url});
          setItems([...completed]);
        }catch(e){
          setError((prior)=>prior+(prior?"\n":"")+input.name+": "+(e instanceof Error?e.message:"AI processing failed"));
        }
      }
      if(!completed.length)throw Error("The AI could not process any of the selected images. Try one smaller JPG.");
      setStage("");setMessage(completed.length+" of "+files.length+" images processed locally, without watermarks.");
    }catch(e){setError((prior)=>prior+(prior?"\n":"")+(e instanceof Error?e.message:"Background removal failed"));}
    finally{setBusy(false);setStage("");}
  };
  const renderPreview=useCallback(async()=>{
    if(!selectedItem)return;
    const canvas=previewRef.current;if(!canvas)return;
    const composed=await composite(selectedItem,mode,bgColor,gradient,backgroundUrl,size,scale,shadow);
    const edge=650,factor=Math.min(1,edge/Math.max(composed.width,composed.height));
    canvas.width=Math.max(1,Math.round(composed.width*factor));
    canvas.height=Math.max(1,Math.round(composed.height*factor));
    canvas.getContext("2d")?.drawImage(composed,0,0,canvas.width,canvas.height);
  },[selectedItem,mode,bgColor,gradient,backgroundUrl,size,scale,shadow]);
  useEffect(()=>{void renderPreview().catch(()=>{});},[renderPreview]);
  useEffect(()=>{
    if(!brushOpen||!selectedItem)return;
    let active=true;
    void loadImage(selectedItem.url).then(image=>{
      if(!active)return;
      const canvas=brushRef.current;if(!canvas)return;
      const maxDim=1250;
      const ratio=Math.min(1,maxDim/Math.max(image.naturalWidth,image.naturalHeight));
      canvas.width=Math.max(1,Math.round(image.naturalWidth*ratio));
      canvas.height=Math.max(1,Math.round(image.naturalHeight*ratio));
      canvas.getContext("2d")?.drawImage(image,0,0,canvas.width,canvas.height);
      paintSourceRef.current=null;setPaintDirty(false);
    }).catch(()=>{});
    return ()=>{active=false;};
  },[brushOpen,selectedItem]);
  const paint=async(e:React.PointerEvent<HTMLCanvasElement>)=>{
    const canvas=e.currentTarget,ctx=canvas.getContext("2d");
    if(!ctx)return;
    const rect=canvas.getBoundingClientRect(),px=(e.clientX-rect.left)*canvas.width/rect.width,py=(e.clientY-rect.top)*canvas.height/rect.height;
    const radius=brushSize*canvas.width/700;
    if(brushMode==="erase"){
      ctx.save();ctx.globalCompositeOperation="destination-out";
      ctx.beginPath();ctx.arc(px,py,radius,0,Math.PI*2);ctx.fill();ctx.restore();
    }else{
      if(!selectedItem)return;
      if(!paintSourceRef.current){
        const originalURL=track(URL.createObjectURL(selectedItem.original));
        paintSourceRef.current=await loadImage(originalURL);
      }
      ctx.save();
      ctx.beginPath();ctx.arc(px,py,radius,0,Math.PI*2);ctx.clip();
      ctx.drawImage(paintSourceRef.current,0,0,canvas.width,canvas.height);
      ctx.restore();
    }
    setPaintDirty(true);
  };
  const applyPaint=async()=>{
    if(!selectedItem||!brushRef.current||busy)return;
    setBusy(true);
    try{
      const blob=await saveCanvas(brushRef.current);
      const url=track(URL.createObjectURL(blob));
      setItems(prev=>prev.map((i,idx)=>idx===selected?{...i,cutout:blob,url}:i));
      setBrushOpen(false);setPaintDirty(false);
      setMessage("Edge changes applied. Restore brush paints original pixels, including any source background.");
    }catch(e){setError(e instanceof Error?e.message:"Could not apply brush");}
    finally{setBusy(false);}
  };
  const exportOne=async(i:Item)=>{
    const canvas=await composite(i,mode,bgColor,gradient,backgroundUrl,size,scale,shadow);
    return await saveCanvas(canvas);
  };
  const saveSelected=async()=>{
    if(!selectedItem||busy)return;
    setBusy(true);setError("");
    try{downloadBlob(await exportOne(selectedItem),safeName(selectedItem.name)+"-airtools.png");}
    catch(e){setError(e instanceof Error?e.message:"Could not export photo");}
    finally{setBusy(false);}
  };
  const saveAll=async()=>{
    if(!items.length||busy)return;
    setBusy(true);setError("");
    try{
      const JSZip=(await import("jszip")).default;
      const zip=new JSZip();
      for(let i=0;i<items.length;i++){
        setStage("Exporting "+(i+1)+" of "+items.length);
        zip.file(String(i+1).padStart(2,"0")+"-"+safeName(items[i].name)+"-studio.png",await exportOne(items[i]));
      }
      setStage("Packing downloadable ZIP");
      downloadBlob(await zip.generateAsync({type:"blob",compression:"DEFLATE",compressionOptions:{level:3}}),"airtools-background-studio.zip");
    }catch(e){setError(e instanceof Error?e.message:"ZIP export failed. Try fewer photos.");}
    finally{setBusy(false);setStage("");}
  };
  return <div className="space-y-6">
    <div className="rounded-2xl border border-border p-5 space-y-2">
      <h2 className="text-xl font-bold">AI Background & Product Photo Studio</h2>
      <p className="text-sm text-muted-foreground">Create transparent cutouts in the browser, prepare product listings, refine alpha edges, add backdrops and export a complete batch as ZIP. No watermarks or paid API required.</p>
      <p className="text-xs text-muted-foreground">AI model files are downloaded on first use. Images stay on your device; large batches may use substantial RAM. Edges, glass, fur and fine hair may need manual cleanup.</p>
    </div>
    <UploadZone accept={{"image/jpeg":[".jpg",".jpeg"],"image/png":[".png"],"image/webp":[".webp"]}} multiple maxFiles={10} maxSize={12*1024*1024}
      onFilesChange={(f)=>{setFiles(f.slice(0,10));clear();}}
      title="Drop product images or portraits" description="Batch up to 10 photos · JPG, PNG, WebP · processed locally"/>
    {files.length>0&&<Button className="w-full" size="lg" variant="gradient" disabled={busy}
      onClick={()=>{void process();}}><WandSparkles className="mr-2 h-4 w-4"/>{busy?"Processing…":"Remove backgrounds ("+files.length+" images)"}</Button>}
    {stage&&<p role="status" className="rounded-lg bg-muted p-3 text-sm">{stage} {message}</p>}
    {error&&<p role="alert" className="whitespace-pre-line rounded-lg border border-red-300 p-3 text-sm text-red-600">{error}</p>}
    {items.length>0&&<div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
      <aside className="space-y-4">
        <div className="rounded-2xl border border-border p-4 space-y-3">
          <h3 className="font-semibold flex items-center gap-2"><Layers className="h-4 w-4"/>Processed images ({items.length})</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 gap-2">
            {items.map((it,i)=><button key={it.id} type="button" onClick={()=>{setSelected(i);setBrushOpen(false);}}
              className={"overflow-hidden rounded-lg border-2 p-1 "+(selected===i?"border-primary":"border-border")} title={it.name}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.url} alt={it.name} className="h-20 w-full object-contain" style={{backgroundImage:"repeating-conic-gradient(#ddd 0 25%, #fff 0 50%)",backgroundSize:"12px 12px"}}/>
              <span className="block truncate text-[10px]">{it.name}</span>
            </button>)}
          </div>
        </div>
        <section className="space-y-3 rounded-2xl border border-border p-4">
          <h3 className="font-semibold">Backdrop</h3>
          <div className="grid grid-cols-2 gap-2">
            {([{id:"transparent",label:"Transparent"},{id:"solid",label:"Solid color"},{id:"gradient",label:"Studio gradient"},{id:"photo",label:"Upload backdrop"}] as {id:Mode,label:string}[]).map(t=>
              <button key={t.id} aria-pressed={mode===t.id} onClick={()=>setMode(t.id)} className={"rounded-lg border p-2 text-sm "+(mode===t.id?"border-primary bg-primary/10":"border-border")}>{t.label}</button>
            )}
          </div>
          {mode==="solid"&&<label className="flex items-center gap-3 text-sm">Background color <input type="color" value={bgColor} onChange={e=>setBgColor(e.target.value)} aria-label="Background color"/></label>}
          {mode==="gradient"&&<label className="block text-sm">Studio look
            <select value={gradient} onChange={e=>setGradient(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background p-2">
              <option value="studio">Clean porcelain</option><option value="sand">Warm sandstone</option><option value="night">Slate studio</option><option value="mint">Mint daylight</option>
            </select>
          </label>}
          {mode==="photo"&&<label className="block text-sm">Your backdrop image
            <input type="file" accept="image/png,image/jpeg,image/webp" className="mt-2 block w-full text-xs" onChange={e=>{
              const file=e.target.files?.[0];if(!file)return;
              if(file.size>12*1024*1024){setError("Background image must be under 12 MiB");return;}
              setBackgroundUrl(track(URL.createObjectURL(file)));
            }}/>
            {!backgroundUrl&&<span className="text-xs text-amber-600">Choose an image; otherwise the output remains transparent.</span>}
          </label>}
          <label className="block text-sm">Output dimensions
            <select value={size} onChange={e=>setSize(e.target.value as OutputSize)} className="mt-1 w-full rounded-lg border border-border bg-background p-2">
              <option value="original">Original pixel dimensions</option><option value="square">Square 1080 × 1080</option>
              <option value="marketplace">Marketplace 2000 × 2000</option><option value="portrait">Portrait 1200 × 1500</option>
            </select>
          </label>
          <label className="block text-sm">Subject scale: {Math.round(scale*100)}%
            <input type="range" className="block w-full accent-primary" min=".35" max="1.18" step=".02" value={scale} onChange={e=>setScale(Number(e.target.value))}/>
          </label>
          {mode!=="transparent"&&<label className="block text-sm">Shadow strength: {shadow}
            <input type="range" className="block w-full accent-primary" min="0" max="32" step="1" value={shadow} onChange={e=>setShadow(Number(e.target.value))}/>
          </label>}
          <Button variant="outline" size="sm" onClick={()=>{setBrushOpen(x=>!x);setPaintDirty(false);}} className="w-full">
            <Brush className="h-4 w-4 mr-2"/> {brushOpen?"Close":"Refine cutout edges"}
          </Button>
        </section>
      </aside>
      <div className="space-y-4">
        <div className="overflow-hidden rounded-2xl border border-border p-4">
          <div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">Studio preview</h3><span className="text-xs text-muted-foreground">{selectedItem&&formatFileSize(selectedItem.cutout.size)}</span></div>
          <div className="flex min-h-72 items-center justify-center rounded-xl p-3" style={{backgroundImage:"repeating-conic-gradient(#e4e4e7 0 25%, #fafafa 0 50%)",backgroundSize:"20px 20px"}}>
            <canvas ref={previewRef} className="max-h-[460px] max-w-full object-contain shadow" aria-label="Composited image preview"/>
          </div>
        </div>
        {brushOpen&&selectedItem&&<section className="space-y-3 rounded-2xl border border-border p-4">
          <h3 className="font-semibold">Manual alpha cleanup</h3>
          <p className="text-xs text-muted-foreground">Erase stray background pixels, or paint original pixels back. Restore may bring back parts of the original background. The editor uses a reduced working resolution for performance.</p>
          <div className="flex items-center gap-4 text-sm">
            <label><input type="radio" checked={brushMode==="erase"} onChange={()=>setBrushMode("erase")}/> Erase</label>
            <label><input type="radio" checked={brushMode==="restore"} onChange={()=>setBrushMode("restore")}/> Restore</label>
            <label>Size <input type="range" min="3" max="90" value={brushSize} onChange={e=>setBrushSize(Number(e.target.value))}/></label>
          </div>
          <canvas ref={brushRef} className="max-w-full touch-none rounded-xl border border-border"
            style={{backgroundImage:"repeating-conic-gradient(#ddd 0 25%, white 0 50%)",backgroundSize:"16px 16px"}}
            onPointerDown={e=>{drawingRef.current=true;e.currentTarget.setPointerCapture(e.pointerId);void paint(e);}}
            onPointerMove={e=>{if(drawingRef.current)void paint(e);}}
            onPointerUp={()=>{drawingRef.current=false;}} onPointerCancel={()=>{drawingRef.current=false;}}
            aria-label="Use pointer to erase or restore pixels"/>
          <Button disabled={!paintDirty||busy} onClick={()=>{void applyPaint();}}><Eraser className="h-4 w-4 mr-2"/>Apply mask edits</Button>
        </section>}
        <div className="grid gap-3 sm:grid-cols-2">
          <Button variant="gradient" size="lg" disabled={busy} onClick={()=>{void saveSelected();}}>
            <Download className="h-4 w-4 mr-2"/>Download selected PNG
          </Button>
          <Button variant="outline" size="lg" disabled={busy} onClick={()=>{void saveAll();}}>
            <Package className="h-4 w-4 mr-2"/>Download batch ZIP
          </Button>
        </div>
        <p className="text-xs text-muted-foreground flex items-start gap-2"><AlertTriangle className="h-4 w-4 shrink-0"/>Our studio uses an AI cutout model and local canvas compositing, not proprietary Photoroom/Pixelcut/Clipdrop models or prompt-generated photography. Selecting 2000 × 2000 exports at that size, but does not create missing image detail.</p>
      </div>
    </div>}
    <div className="rounded-xl border border-border p-3 text-xs text-muted-foreground">
      Background cutout engine: <a className="underline" href="https://github.com/imgly/background-removal-js" target="_blank" rel="noreferrer">@imgly/background-removal (AGPL)</a>.
      Source code: <a className="underline" href="https://github.com/akggautamasar/airtools" target="_blank" rel="noreferrer">AirTools on GitHub</a>.
      <ImageIcon className="inline h-3 w-3 ml-2"/> No third-party image generation API is used in this studio.
    </div>
  </div>;
}

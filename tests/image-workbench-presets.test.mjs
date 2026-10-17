import assert from "node:assert/strict";
import {test} from "node:test";
import {
 IMAGE_WORKBENCH_TOOLS,EXACT_KB_PRESETS,IMAGE_TOOLBOX_GROUPS,
 IMAGE_WORKBENCH_BY_SLUG,EXISTING_IMAGE_TOOLBOX_LINKS,asImageTool
} from "../src/lib/image-workbench-presets.ts";
test("all new tool slugs are unique and resolve to a defined actual operation",()=>{
 const slugs=IMAGE_WORKBENCH_TOOLS.map(x=>x.slug);
 assert.equal(new Set(slugs).size,slugs.length);
 for(const x of IMAGE_WORKBENCH_TOOLS){
  assert.equal(IMAGE_WORKBENCH_BY_SLUG[x.slug]?.mode,x.mode);
  assert.ok(IMAGE_TOOLBOX_GROUPS.includes(x.group));
  assert.ok(x.description.length>18);
  assert.equal(asImageTool(x).category,"image");
 }
});
test("every exact KB preset has a positive, bounded output size",()=>{
 assert.ok(EXACT_KB_PRESETS.length>=18);
 assert.ok(EXACT_KB_PRESETS.every(x=>x>0&&x<=2048));
 for(const kb of EXACT_KB_PRESETS)assert.equal(IMAGE_WORKBENCH_BY_SLUG[`compress-to-${kb}kb`].targetKB,kb);
});
test("physical preset and target PDF options are coherent",()=>{
 const values=IMAGE_WORKBENCH_TOOLS.filter(x=>x.unit&&x.width&&x.height);
 for(const p of values)assert.ok(p.width>0&&p.height>0&&(!p.dpi||p.dpi>=36));
 const pdf=IMAGE_WORKBENCH_TOOLS.filter(x=>x.mode==="pdf");
 assert.ok(pdf.length>=8);
 assert.ok(pdf.every(x=>!x.targetKB||x.targetKB>=50));
});
test("directory does not overwrite new routes with existing tool refs",()=>{
 const slugs=new Set(IMAGE_WORKBENCH_TOOLS.map(x=>x.slug));
 assert.ok(EXISTING_IMAGE_TOOLBOX_LINKS.every(x=>!slugs.has(x.slug)));
});

import { h } from "preact";
import { registerBlock } from "@eventhub/block-runtime";
import {
  HeroBlock,
  CollectionBlock,
  MicrocalendarBlock,
  DetailBlock,
  MapGridBlock,
  PromoSlotBlock
} from "@eventhub/blocks";

let registered = false;

export function ensureBlocksRegistered() {
  if (registered) return;
  registerBlock("hero", (props) => h(HeroBlock, props));
  registerBlock("collection", (props) => h(CollectionBlock, props));
  registerBlock("microcalendar", (props) => h(MicrocalendarBlock, props));
  registerBlock("detail", (props) => h(DetailBlock, props));
  registerBlock("map-grid", (props) => h(MapGridBlock, props));
  registerBlock("promo-slot", (props) => h(PromoSlotBlock, props));
  registered = true;
}

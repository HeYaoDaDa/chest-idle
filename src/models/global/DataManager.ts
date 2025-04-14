import { markRaw } from "vue"
import type { ActionTarget } from "../actionTarget"
import type { Item } from "../item"
import { Skill } from "../Skill"
import { State } from "../state/State"
import type { Definition } from "../definitions"
import { GatheringZone } from "../actionTarget/GatheringZone"
import { Recipe } from "../actionTarget/Recipe"
import { Chest } from "../item/Chest"
import { Equipment } from "../item/Equipment"
import { Resource } from "../item/Resource"
import { Slot } from "../Slot"

class DataManager {
  private skillIdMap = new Map<string, Skill>();
  private stateIdMap = new Map<string, State>();
  private slotIdMap = new Map<string, Slot>();
  private itemIdMap = new Map<string, Item>();
  private chestIdMap = new Map<string, Chest>();
  private actionTargetIdMap = new Map<string, ActionTarget>();

  public allSkill: Skill[] = []
  public allSlot: Slot[] = []
  public allChest: Chest[] = []

  load(definitions: Definition[]) {
    for (const definition of definitions) {
      this.handleDefinition(definition);
    }
    this.allSkill = Array.from(this.skillIdMap.values()).sort((a, b) => a.sort - b.sort);
    this.allSlot = Array.from(this.slotIdMap.values()).sort((a, b) => a.sort - b.sort);
    this.allChest = Array.from(this.chestIdMap.values()).sort((a, b) => a.sort - b.sort);
    //reverse link
    for (const skill of this.allSkill) {
      skill.actionTargets = Array.from(this.actionTargetIdMap.values()).filter(it => it.skill.id === skill.id).sort((a, b) => a.sort - b.sort);
    }
  }

  private handleDefinition(definition: Definition) {
    switch (definition.type) {
      case 'skill':
        const skill = markRaw(new Skill(definition.id, definition.sort));
        this.skillIdMap.set(skill.id, skill);
        break;
      case 'state':
        const state = markRaw(new State(definition.base));
        this.stateIdMap.set(definition.id, state);
        break;
      case 'slot':
        const slot = markRaw(new Slot(definition.id, definition.sort));
        this.slotIdMap.set(slot.id, slot);
        break;
      case 'item':
        let item: Item;
        switch (definition.itemType) {
          case 'resource':
            item = markRaw(new Resource(definition.id, definition.sort));
            break;
          case 'chest':
            const chest = markRaw(new Chest(definition.id, definition.sort, definition.maxPoints, definition.loots))
            this.chestIdMap.set(chest.id, chest);
            item = chest;
            break;
          case 'equipment':
            item = markRaw(new Equipment(definition.id, definition.sort, definition.slot, definition.effects));
            break;
        }
        this.itemIdMap.set(item.id, item);
        break;
      case 'actionTarget':
        let actionTarget: ActionTarget;
        switch (definition.targetType) {
          case 'gatheringZone':
            actionTarget = markRaw(new GatheringZone(definition.id, definition.skill, definition.minLevel, definition.sort, definition.duration, definition.xp, definition.chest, definition.chestPoints, definition.products));
            break;
          case 'recipe':
            actionTarget = markRaw(new Recipe(definition.id, definition.skill, definition.minLevel, definition.sort, definition.duration, definition.xp, definition.chest, definition.chestPoints, definition.ingredients, definition.products));
            break;
        }
        this.actionTargetIdMap.set(actionTarget.id, actionTarget);
    }
  }

  getSkillById(id: string): Skill {
    const skill = this.skillIdMap.get(id)
    if (skill) {
      return skill
    } else {
      throw `skill ${id} not find`
    }
  }

  getStateById(id: string): State {
    const state = this.stateIdMap.get(id)
    if (state) {
      return state
    } else {
      throw `state ${id} not find`
    }
  }

  getSlotById(id: string): Slot {
    const slot = this.slotIdMap.get(id)
    if (slot) {
      return slot
    } else {
      throw `slot ${id} not find`
    }
  }

  getItemById(id: string): Item {
    const item = this.itemIdMap.get(id)
    if (item) {
      return item
    } else {
      throw `item ${id} not find`
    }
  }

  getChestById(id: string): Chest {
    const chest = this.chestIdMap.get(id)
    if (chest) {
      return chest
    } else {
      throw `chest ${id} not find`
    }
  }
}

export const dataManager = new DataManager();

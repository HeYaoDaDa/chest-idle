import axios from 'axios'
import { ref } from 'vue'
import type { Definition } from '../definitions'
import { dataManager } from './DataManager'
import { actionManager } from './ActionManager'
import { inventory } from './InventoryManager'

export class Global {
  public status = ref('none' as 'none' | 'loading' | 'finish' | 'fail')

  async load() {
    this.status.value = 'loading'
    try {
      //definition
      const paths = [
        '/data/skills.json',
        '/data/states.json',
        '/data/slots.json',
        '/data/items/resources.json',
        '/data/items/chests.json',
        '/data/items/equipment.json',
        '/data/actionTargets/gatheringZones.json',
        '/data/actionTargets/gatheringZones1.json',
        '/data/actionTargets/recipes.json',
      ]
      const responses = await Promise.all(paths.map((p) => axios.get(p)))
      const definitions = responses.flatMap((r) => r.data as Definition[])

      dataManager.load(definitions)
      actionManager.load()
      inventory.load()
      this.status.value = 'finish'
    } catch (error) {
      console.error('Failed to load data:', error)
      this.status.value = 'fail'
    }
  }
}

export const global = new Global()

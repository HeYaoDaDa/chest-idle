import axios from 'axios';
import { ref } from 'vue';
import type { Definition } from '../definitions';
import { dataManager } from './DataManager';
import { actionManager } from './ActionManager';
import { inventory } from './InventoryManager';

export class Global {
  public status = ref('none' as 'none' | 'loading' | 'finish' | 'fail')

  async load() {
    this.status.value = 'loading'
    try {
      //definition
      const response = await axios.get('/data.json')
      const definitions = response.data as Definition[]
      dataManager.load(definitions);
      actionManager.load();
      inventory.load();
      this.status.value = 'finish';
    } catch (error) {
      console.error('Failed to load data:', error)
      this.status.value = 'fail'
    }
  }
}

export const global = new Global();

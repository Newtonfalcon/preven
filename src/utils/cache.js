
import * as Securestore from 'expo-secure-store'
import { Platform } from 'react-native'

const createTokenCache = () => {
  return {
    async getToken(key) {
      try {
        const item = Securestore.getItemAsync(key)
        return item

      } catch (err) {
        console.error('SecureStore get item error: ', err);
                await Securestore.deleteItemAsync(key);
                return null;

      }


    },

    async saveToken(key, value) {
      try {
        return await Securestore.setItemAsync(key, value)
      }
      catch (err) {
        return
      }
    }


  }
}


export const tokenCache = Platform.OS !== 'web' ? createTokenCache() : undefined;

import { Howl } from 'howler'
import { type App, Notice } from 'obsidian'
import { SoundLoader } from './soundLoader'
import type { TickTonesSettings } from './types'

export class SoundManager {
  private loadedSounds: Record<string, string> = {}
  private soundCache: Record<string, Howl> = {}
  private soundLoader: SoundLoader
  private settings: TickTonesSettings

  constructor(app: App, settings: TickTonesSettings, pluginDir: string) {
    this.settings = settings
    this.soundLoader = new SoundLoader(app, pluginDir)
  }

  async init(): Promise<void> {
    this.loadedSounds = await this.soundLoader.loadSounds()
  }

  private async playSound(sound: string, volume: number): Promise<void> {
    if (Object.keys(this.loadedSounds).length === 0) {
      console.warn('No sounds found.  Aborting.')
      return
    }

    const soundData = this.loadedSounds[sound]

    if (!soundData) {
      console.error(`Sound "${sound}" not found.`)
      return
    }

    let howl = this.soundCache[sound]

    if (!howl) {
      howl = new Howl({ src: [soundData], preload: true })
      this.soundCache[sound] = howl
    }

    howl.volume(volume)

    howl.play()
  }

  private getRandomSound(sounds: string[]): string | null {
    if (sounds.length === 0) {
      new Notice(
        'No random sound available, please check your settings and select sound(s).',
        10 * 1000
      )
      console.warn('No random sound available, playing nothing.')
      return null
    }

    const randomIndex = Math.floor(Math.random() * sounds.length)
    return sounds[randomIndex]
  }

  public async playTickSound(): Promise<void> {
    if (!this.settings.tickSoundEnabled) {
      return
    }

    if (!this.settings.useRandomTickSound) {
      this.playSound(this.settings.tickSound, this.settings.tickSoundVolume).catch((error) => {
        console.error(error)
      })
      return
    }

    const randomSound = this.getRandomSound(this.settings.tickSounds)

    if (!randomSound) {
      return
    }

    this.playSound(randomSound, this.settings.tickSoundVolume).catch((error) => {
      console.error(error)
    })
  }

  public async playUntickSound(): Promise<void> {
    if (!this.settings.untickSoundEnabled) {
      return
    }

    if (!this.settings.useRandomUntickSound) {
      this.playSound(this.settings.untickSound, this.settings.untickSoundVolume).catch((error) => {
        console.error(error)
      })
      return
    }

    const randomSound = this.getRandomSound(this.settings.untickSounds)

    if (!randomSound) {
      return
    }

    this.playSound(randomSound, this.settings.untickSoundVolume).catch((error) => {
      console.error(error)
    })
  }

  public getSounds(): string[] {
    return Object.keys(this.loadedSounds)
  }

  public async reloadSounds(): Promise<void> {
    this.loadedSounds = await this.soundLoader.loadSounds()
  }

  public unload(): void {
    Object.values(this.soundCache).forEach((howl) => {
      howl.unload()
    })
    this.soundCache = {}
  }
}

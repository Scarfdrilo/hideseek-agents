declare module '@mkkellogg/gaussian-splats-3d' {
  export class Viewer {
    constructor(options?: any);
    addSplatScene(url: string, options?: any): Promise<void>;
    start(): void;
    dispose(): void;
  }
  export default any;
}

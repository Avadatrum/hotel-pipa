// src/types/html5-qrcode.d.ts

declare module 'html5-qrcode' {
  export interface CameraDevice {
    id: string;
    label: string;
  }

  export interface Html5QrcodeConfig {
    fps?: number;
    qrbox?: { width: number; height: number };
    aspectRatio?: number;
    disableFlip?: boolean;
    formatsToSupport?: Html5QrcodeSupportedFormats[];
  }

  export enum Html5QrcodeSupportedFormats {
    QR_CODE = 0,
    AZTEC = 1,
    CODABAR = 2,
    CODE_39 = 3,
    CODE_93 = 4,
    CODE_128 = 5,
    DATA_MATRIX = 6,
    MAXICODE = 7,
    PDF_417 = 8,
    RSS_14 = 9,
    RSS_EXPANDED = 10,
    UPC_A = 11,
    UPC_E = 12,
    UPC_EAN_EXTENSION = 13
  }

  export enum Html5QrcodeScannerState {
    UNKNOWN = 0,
    NOT_STARTED = 1,
    SCANNING = 2,
    PAUSED = 3,
    STOPPED = 4
  }

  export class Html5Qrcode {
    constructor(elementId: string, verbose?: boolean);
    
    start(
      cameraIdOrConfig: string | MediaTrackConstraints,
      configuration: Html5QrcodeConfig | undefined,
      qrCodeSuccessCallback: (decodedText: string, decodedResult?: any) => void,
      qrCodeErrorCallback?: (errorMessage: string, error?: any) => void
    ): Promise<void>;
    
    stop(): Promise<void>;
    
    clear(): Promise<void>;
    
    getState(): Html5QrcodeScannerState;
    
    pause(): void;
    
    resume(): void;
    
    isScanning(): boolean;
    
    getRunningTrackCapabilities(): MediaTrackCapabilities | null;
    
    getRunningTrackSettings(): MediaTrackSettings | null;
    
    applyVideoConstraints(constraints: MediaTrackConstraints): Promise<void>;
    
    static getCameras(): Promise<CameraDevice[]>;
  }
}
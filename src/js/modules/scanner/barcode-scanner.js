// barcode-scanner.js - Módulo para leitura de códigos de barras pela câmera
const barcodeScanner = (function() {
  // Dependência do QuaggaJS (deve ser carregada no HTML)
  // https://github.com/serratus/quaggaJS
  
  // Elementos do scanner
  let scannerContainer = null;
  let videoElement = null;
  let canvasElement = null;
  let scannerActive = false;
  
  // Callbacks
  let onDetectedCallback = null;
  let onErrorCallback = null;
  
  // Configuração do scanner
  const defaultConfig = {
    inputStream: {
      name: "Live",
      type: "LiveStream",
      target: null, // será configurado na inicialização
      constraints: {
        width: { min: 640 },
        height: { min: 480 },
        facingMode: "environment", // usar câmera traseira
        aspectRatio: { min: 1, max: 2 }
      }
    },
    locator: {
      patchSize: "medium",
      halfSample: true
    },
    numOfWorkers: 2,
    frequency: 10,
    decoder: {
      readers: [
        "ean_reader",
        "ean_8_reader",
        "code_39_reader",
        "code_128_reader",
        "upc_reader",
        "upc_e_reader",
        "qr_reader" // Adicionado leitor de QR Code
      ]
    },
    locate: true,
    multiple: false // Por padrão, não detecta múltiplos códigos
  };
  
  // Inicializar o scanner
  const init = (containerId, options = {}) => {
    return new Promise((resolve, reject) => {
      try {
        // Verificar se o Quagga está disponível
        if (typeof Quagga === 'undefined') {
          const error = new Error('Biblioteca QuaggaJS não carregada. Adicione o script no HTML.');
          console.error(error);
          reject(error);
          return;
        }
        
        // Obter container
        scannerContainer = document.getElementById(containerId);
        if (!scannerContainer) {
          const error = new Error(`Container com ID '${containerId}' não encontrado.`);
          console.error(error);
          reject(error);
          return;
        }
        
        // Limpar container
        scannerContainer.innerHTML = '';
        
        // Criar elemento de vídeo e canvas
        videoElement = document.createElement('video');
        videoElement.className = 'scanner-video';
        
        canvasElement = document.createElement('canvas');
        canvasElement.className = 'scanner-canvas';
        
        // Adicionar ao container
        scannerContainer.appendChild(videoElement);
        scannerContainer.appendChild(canvasElement);
        
        // Adicionar estilos básicos
        scannerContainer.style.position = 'relative';
        videoElement.style.width = '100%';
        
        canvasElement.style.position = 'absolute';
        canvasElement.style.top = '0';
        canvasElement.style.left = '0';
        canvasElement.style.width = '100%';
        canvasElement.style.height = '100%';
        
        // Adicionar mira/alvo
        const targetElement = document.createElement('div');
        targetElement.className = 'scanner-target';
        targetElement.style.position = 'absolute';
        targetElement.style.top = '50%';
        targetElement.style.left = '50%';
        targetElement.style.width = '200px';
        targetElement.style.height = '200px';
        targetElement.style.transform = 'translate(-50%, -50%)';
        targetElement.style.border = '2px solid var(--primary-color)';
        targetElement.style.borderRadius = '20px';
        targetElement.style.boxShadow = '0 0 0 4000px rgba(0, 0, 0, 0.3)';
        
        scannerContainer.appendChild(targetElement);
        
        // Configurar Quagga
        const config = { ...defaultConfig, ...options };
        config.inputStream.target = scannerContainer;
        
        // Resolver a promessa
        resolve(true);
      } catch (error) {
        console.error('Erro ao inicializar scanner:', error);
        reject(error);
      }
    });
  };
  
  // Iniciar o scanner
  const start = (callback) => {
    return new Promise((resolve, reject) => {
      try {
        // Verificar se o scanner foi inicializado
        if (!scannerContainer) {
          const error = new Error('Scanner não inicializado. Chame init() primeiro.');
          console.error(error);
          reject(error);
          return;
        }
        
        // Salvar callback
        onDetectedCallback = callback;
        
        // Configurar Quagga
        Quagga.init({
          ...defaultConfig,
          inputStream: {
            ...defaultConfig.inputStream,
            target: scannerContainer
          }
        }, (err) => {
          if (err) {
            console.error('Erro ao inicializar QuaggaJS:', err);
            reject(err);
            return;
          }
          
          // Configurar evento de detecção
          Quagga.onDetected((result) => {
            if (result && result.codeResult && result.codeResult.code) {
              // Desenhar resultado
              drawResult(result);
              
              // Executar callback
              if (typeof onDetectedCallback === 'function') {
                onDetectedCallback(result.codeResult.code);
              }
            }
          });
          
          // Configurar evento para desenhar no canvas
          Quagga.onProcessed((result) => {
            const drawingCtx = Quagga.canvas.ctx.overlay;
            const drawingCanvas = Quagga.canvas.dom.overlay;
            
            if (result) {
              // Limpar o canvas
              if (drawingCtx) {
                drawingCtx.clearRect(
                  0, 
                  0, 
                  parseInt(drawingCanvas.getAttribute('width')), 
                  parseInt(drawingCanvas.getAttribute('height'))
                );
              }
              
              // Desenhar caixas nas áreas detectadas
              if (result.boxes) {
                drawingCtx.strokeStyle = 'green';
                drawingCtx.lineWidth = 2;
                
                for (let i = 0; i < result.boxes.length; i++) {
                  const box = result.boxes[i];
                  if (box !== result.box) {
                    drawingCtx.beginPath();
                    drawingCtx.moveTo(box[0][0], box[0][1]);
                    drawingCtx.lineTo(box[1][0], box[1][1]);
                    drawingCtx.lineTo(box[2][0], box[2][1]);
                    drawingCtx.lineTo(box[3][0], box[3][1]);
                    drawingCtx.lineTo(box[0][0], box[0][1]);
                    drawingCtx.stroke();
                  }
                }
              }
              
              // Destacar código de barras encontrado
              if (result.box) {
                drawingCtx.strokeStyle = '#FFD700'; // Amarelo fixo para visualização
                drawingCtx.lineWidth = 4;
                
                drawingCtx.beginPath();
                drawingCtx.moveTo(result.box[0][0], result.box[0][1]);
                drawingCtx.lineTo(result.box[1][0], result.box[1][1]);
                drawingCtx.lineTo(result.box[2][0], result.box[2][1]);
                drawingCtx.lineTo(result.box[3][0], result.box[3][1]);
                drawingCtx.lineTo(result.box[0][0], result.box[0][1]);
                drawingCtx.stroke();
              }
              
              // Destacar a linha de leitura
              if (result.line) {
                drawingCtx.strokeStyle = '#FFD700'; // Amarelo fixo para visualização
                drawingCtx.lineWidth = 4;
                
                drawingCtx.beginPath();
                drawingCtx.moveTo(result.line[0][0], result.line[0][1]);
                drawingCtx.lineTo(result.line[1][0], result.line[1][1]);
                drawingCtx.stroke();
              }
            }
          });
          
          // Iniciar scanner
          Quagga.start();
          scannerActive = true;
          
          resolve(true);
        });
      } catch (error) {
        console.error('Erro ao iniciar scanner:', error);
        reject(error);
      }
    });
  };
  
  // Parar o scanner
  const stop = () => {
    if (scannerActive && typeof Quagga !== 'undefined') {
      Quagga.stop();
      scannerActive = false;
    }
  };
  
  // Desenhar resultado no canvas
  const drawResult = (result) => {
    // Implementação opcional para destacar o resultado
  };
  
  // Verificar se o dispositivo tem câmera
  const checkCameraAvailability = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        reject(new Error('API de câmera não suportada neste navegador.'));
        return;
      }
      
      navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
          // Liberar stream após o teste
          const tracks = stream.getTracks();
          tracks.forEach(track => track.stop());
          
          resolve(true);
        })
        .catch((error) => {
          console.error('Erro ao acessar câmera:', error);
          reject(error);
        });
    });
  };
  
  // API pública
  return {
    init,
    start,
    stop,
    checkCameraAvailability,
    isActive: () => scannerActive
  };
})();

// Exportar para uso global
window.barcodeScanner = barcodeScanner;
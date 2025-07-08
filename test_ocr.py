from paddleocr import PaddleOCR

# Crear l'objecte OCR amb detecció d'orientació de línies activada i idioma anglès
ocr = PaddleOCR(use_textline_orientation=True, lang='en')

img_path = '../../cotxe.jpg'

# Executar OCR a la imatge amb la nova API
result = ocr.predict(img_path)

# Mostrar els resultats (caixa delimitadora + text + confiança)
for line in result:
    bbox, (text, confidence) = line
    print(f'Text detectat: {text}, Confiança: {confidence:.2f}, Caixa: {bbox}')


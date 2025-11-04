import json
import os
import base64
from typing import Dict, Any
from openai import OpenAI

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Анализирует фото блюда через OpenAI Vision и возвращает состав, КБЖУ и рекомендации
    Args: event - dict с httpMethod, body (base64 изображение)
          context - объект с request_id
    Returns: HTTP response с данными о блюде
    '''
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    try:
        body_str = event.get('body', '{}')
        if not body_str or body_str.strip() == '':
            body_str = '{}'
        body_data = json.loads(body_str)
    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Invalid JSON in request body'})
        }
    
    image_base64 = body_data.get('image')
    
    if not image_base64:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Image is required'})
        }
    
    api_key = os.environ.get('OPENAI_API_KEY')
    if not api_key:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'OpenAI API key not configured'})
        }
    
    try:
        
        client = OpenAI(api_key=api_key)
        
        prompt = """Проанализируй это блюдо и верни JSON с такой структурой:
{
  "dishName": "Название блюда на русском",
  "calories": число калорий,
  "protein": граммы белка,
  "fats": граммы жиров,
  "carbs": граммы углеводов,
  "ingredients": [
    {"name": "Ингредиент", "amount": "150г", "category": "Белок|Овощи|Молочное|Соусы|Углеводы|Другое"}
  ],
  "recommendations": [
    "Рекомендация 1",
    "Рекомендация 2",
    "Рекомендация 3"
  ]
}

Будь точным в оценке КБЖУ. Давай практичные рекомендации по питанию."""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_base64}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=1000
        )
        
        result_text = response.choices[0].message.content
        
        json_start = result_text.find('{')
        json_end = result_text.rfind('}') + 1
        if json_start != -1 and json_end > json_start:
            result_text = result_text[json_start:json_end]
        
        nutrition_data = json.loads(result_text)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps(nutrition_data, ensure_ascii=False)
        }
        
    except json.JSONDecodeError as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': f'Failed to parse AI response: {str(e)}'})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)})
        }
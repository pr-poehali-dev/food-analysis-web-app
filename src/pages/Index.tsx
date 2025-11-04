import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

interface NutritionData {
  calories: number;
  protein: number;
  fats: number;
  carbs: number;
  ingredients: Array<{
    name: string;
    amount: string;
    category: string;
  }>;
  recommendations: string[];
  dishName: string;
}

const Index = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [nutritionData, setNutritionData] = useState<NutritionData | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const imageData = event.target?.result as string;
        setSelectedImage(imageData);
        await analyzeImage(imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async (imageData: string) => {
    if (!imageData) return;
    
    setIsAnalyzing(true);
    
    try {
      const base64Image = imageData.split(',')[1];
      
      const response = await fetch('https://functions.poehali.dev/eb35858d-ef63-46f4-887e-b9ae061ac0a7', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Image
        })
      });
      
      if (!response.ok) {
        throw new Error('Ошибка анализа');
      }
      
      const data = await response.json();
      setNutritionData(data);
      toast.success('Анализ завершён!');
    } catch (error) {
      console.error('Error analyzing image:', error);
      toast.error('Не удалось проанализировать изображение. Попробуйте ещё раз.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getTotalMacros = () => {
    if (!nutritionData) return 0;
    return nutritionData.protein + nutritionData.fats + nutritionData.carbs;
  };

  const getPercentage = (value: number) => {
    const total = getTotalMacros();
    return total > 0 ? (value / total) * 100 : 0;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Белок': 'bg-blue-100 text-blue-700',
      'Овощи': 'bg-green-100 text-green-700',
      'Молочное': 'bg-yellow-100 text-yellow-700',
      'Соусы': 'bg-orange-100 text-orange-700',
      'Углеводы': 'bg-purple-100 text-purple-700'
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <header className="text-center mb-12 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Icon name="Utensils" size={40} className="text-primary" />
            <h1 className="text-4xl font-bold text-gray-900">NutriScan</h1>
          </div>
          <p className="text-lg text-gray-600">
            Загрузите фото блюда и получите полный анализ состава и КБЖУ
          </p>
        </header>

        {!selectedImage ? (
          <Card className="max-w-2xl mx-auto p-12 text-center border-2 border-dashed border-gray-300 hover:border-primary transition-colors cursor-pointer animate-scale-in">
            <label htmlFor="image-upload" className="cursor-pointer block">
              <div className="flex flex-col items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon name="Camera" size={48} className="text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold mb-2 text-gray-900">
                    Загрузите фото блюда
                  </h3>
                  <p className="text-gray-600">
                    Нажмите или перетащите изображение
                  </p>
                </div>
                <Button size="lg" className="mt-4">
                  <Icon name="Upload" size={20} className="mr-2" />
                  Выбрать фото
                </Button>
              </div>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6 animate-slide-up">
              <Card className="overflow-hidden">
                <img
                  src={selectedImage}
                  alt="Uploaded dish"
                  className="w-full h-80 object-cover"
                />
              </Card>

              {isAnalyzing ? (
                <Card className="p-8">
                  <div className="flex flex-col items-center gap-4">
                    <Icon name="Loader2" size={48} className="text-primary animate-spin" />
                    <p className="text-lg font-medium text-gray-700">
                      Анализируем блюдо...
                    </p>
                  </div>
                </Card>
              ) : nutritionData && (
                <>
                  <Card className="p-6">
                    <h3 className="text-2xl font-bold mb-6 text-gray-900">
                      {nutritionData.dishName}
                    </h3>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-6 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon name="Flame" size={20} className="text-primary" />
                          <p className="text-sm font-medium text-gray-600">Калории</p>
                        </div>
                        <p className="text-3xl font-bold text-gray-900">
                          {nutritionData.calories}
                        </p>
                        <p className="text-sm text-gray-500">ккал</p>
                      </div>

                      <div className="bg-gradient-to-br from-secondary/10 to-secondary/5 p-6 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon name="Scale" size={20} className="text-secondary" />
                          <p className="text-sm font-medium text-gray-600">Порция</p>
                        </div>
                        <p className="text-3xl font-bold text-gray-900">
                          {nutritionData.ingredients.reduce((sum, ing) => 
                            sum + parseInt(ing.amount), 0
                          )}
                        </p>
                        <p className="text-sm text-gray-500">грамм</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Icon name="Drumstick" size={16} className="text-blue-600" />
                            Белки
                          </span>
                          <span className="text-sm font-bold text-gray-900">
                            {nutritionData.protein}г ({getPercentage(nutritionData.protein).toFixed(0)}%)
                          </span>
                        </div>
                        <Progress value={getPercentage(nutritionData.protein)} className="h-3 bg-blue-100" />
                      </div>

                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Icon name="Droplet" size={16} className="text-yellow-600" />
                            Жиры
                          </span>
                          <span className="text-sm font-bold text-gray-900">
                            {nutritionData.fats}г ({getPercentage(nutritionData.fats).toFixed(0)}%)
                          </span>
                        </div>
                        <Progress value={getPercentage(nutritionData.fats)} className="h-3 bg-yellow-100" />
                      </div>

                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Icon name="Wheat" size={16} className="text-purple-600" />
                            Углеводы
                          </span>
                          <span className="text-sm font-bold text-gray-900">
                            {nutritionData.carbs}г ({getPercentage(nutritionData.carbs).toFixed(0)}%)
                          </span>
                        </div>
                        <Progress value={getPercentage(nutritionData.carbs)} className="h-3 bg-purple-100" />
                      </div>
                    </div>
                  </Card>
                </>
              )}

              <Button
                onClick={() => {
                  setSelectedImage(null);
                  setNutritionData(null);
                }}
                variant="outline"
                className="w-full"
              >
                <Icon name="RefreshCw" size={20} className="mr-2" />
                Загрузить другое фото
              </Button>
            </div>

            {nutritionData && (
              <div className="space-y-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <Card className="p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900">
                    <Icon name="List" size={24} className="text-primary" />
                    Состав блюда
                  </h3>
                  <div className="space-y-3">
                    {nutritionData.ingredients.map((ingredient, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Icon name="CircleDot" size={16} className="text-primary" />
                          <span className="font-medium text-gray-900">
                            {ingredient.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getCategoryColor(ingredient.category)}>
                            {ingredient.category}
                          </Badge>
                          <span className="text-sm font-semibold text-gray-700">
                            {ingredient.amount}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900">
                    <Icon name="Lightbulb" size={24} className="text-green-600" />
                    Рекомендации
                  </h3>
                  <ul className="space-y-3">
                    {nutritionData.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Icon name="CheckCircle2" size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 leading-relaxed">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900">
                    <Icon name="TrendingUp" size={24} className="text-blue-600" />
                    Дневная норма
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Калории (2000 ккал)</span>
                      <span className="font-bold text-blue-600">
                        {((nutritionData.calories / 2000) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <Progress 
                      value={(nutritionData.calories / 2000) * 100} 
                      className="h-2 bg-blue-100"
                    />
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
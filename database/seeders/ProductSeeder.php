<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    /**
     * Seed the storefront catalog.
     */
    public function run(): void
    {
        collect([
            [
                'slug' => 'p6',
                'name' => 'Japamala Olho de Tigre',
                'price' => 219.9,
                'category' => 'Japamalas',
                'stone' => 'Olho de Tigre',
                'badge' => 'MAIS VENDIDA',
                'reviews' => 120,
                'description' => 'Proteção, coragem e foco. O Olho de Tigre fortalece a autoconfiança e atrai boas oportunidades.',
                'image_path' => '/images/auraleve/product-p6.png',
                'detail_image_path' => '/images/auraleve/product-p6-detail.png',
                'stock' => 14,
            ],
            [
                'slug' => 'p1',
                'name' => 'Japamala Ágata',
                'price' => 189.9,
                'category' => 'Japamalas',
                'stone' => 'Ágata Branca',
                'reviews' => 84,
                'description' => 'Serenidade e equilíbrio. A Ágata acalma a mente e sustenta a prática diária de respiração.',
                'image_path' => '/images/auraleve/product-p1.png',
                'stock' => 22,
            ],
            [
                'slug' => 'p3',
                'name' => 'Colar Quartzo Rosa',
                'price' => 199.9,
                'category' => 'Colares',
                'stone' => 'Quartzo Rosa',
                'badge' => 'NOVA',
                'reviews' => 156,
                'description' => 'A pedra do amor-próprio. Abre o coração para relações mais leves e verdadeiras.',
                'image_path' => '/images/auraleve/product-p3.png',
                'stock' => 18,
            ],
            [
                'slug' => 'p4',
                'name' => 'Pulseira Hematita',
                'price' => 89.9,
                'category' => 'Pulseiras',
                'stone' => 'Hematita',
                'reviews' => 97,
                'description' => 'Aterramento e proteção. A Hematita devolve foco ao corpo quando a cabeça acelera.',
                'image_path' => '/images/auraleve/product-p4.png',
                'stock' => 35,
            ],
            [
                'slug' => 'p2',
                'name' => 'Pulseira 7 Nós',
                'price' => 99.9,
                'category' => 'Pulseiras',
                'stone' => 'Algodão encerado',
                'reviews' => 212,
                'description' => 'Sete nós, sete intenções. Amarre no punho esquerdo e faça um pedido a cada nó.',
                'image_path' => '/images/auraleve/product-p2.png',
                'stock' => 28,
            ],
            [
                'slug' => 'p5',
                'name' => 'Patuá Proteção',
                'price' => 129.9,
                'category' => 'Patuás',
                'stone' => 'Arruda e sal grosso',
                'badge' => 'ÚLTIMAS',
                'reviews' => 61,
                'description' => 'Feito e selado à mão para guardar sua casa. Leve na bolsa ou pendure na porta.',
                'image_path' => '/images/auraleve/product-p5.png',
                'stock' => 6,
            ],
        ])->each(fn (array $product): Product => Product::updateOrCreate(
            ['slug' => $product['slug']],
            $product + ['active' => true],
        ));
    }
}

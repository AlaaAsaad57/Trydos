USed ENUMS:

<?php

namespace App\Enums\Categories;

enum GroupAgeEnum: int
{
    case AllAges = 0;       // For all ages (electrical devices, home goods, etc.)
    case Infant = 1;        // 0-2 years
    case Toddler = 2;       // 3-5 years
    case Child = 3;         // 6-12 years
    case Teen = 4;          // 13-17 years
    case YoungAdult = 5;    // 18-25 years
    case Adult = 6;         // 26-40 years
    case MiddleAge = 7;     // 41-60 years
    case Senior = 8;        // 61+ years
    case Plus3 = 9;         // +3 years
    case Minus3 = 10;       // -3 years
    case Plus5 = 11;        // +5 years
    case Minus5 = 12;       // -5 years
    case Plus18 = 13;       // +18 years

    public function label(): string
    {
        return match ($this) {
            self::AllAges => "All Ages",
            self::Infant => "Infant (0-2 years)",
            self::Toddler => "Toddler (3-5 years)",
            self::Child => "Child (6-12 years)",
            self::Teen => "Teen (13-17 years)",
            self::YoungAdult => "Young Adult (18-25 years)",
            self::Adult => "Adult (26-40 years)",
            self::MiddleAge => "Middle Age (41-60 years)",
            self::Senior => "Senior (61+ years)",
            self::Plus3 => "+3 years",
            self::Minus3 => "-3 years",
            self::Plus5 => "+5 years",
            self::Minus5 => "-5 years",
            self::Plus18 => "+18 years",
        };
    }

    public function shortLabel(): string
    {
        return match ($this) {
            self::AllAges => "All Ages",
            self::Infant => "Infant",
            self::Toddler => "Toddler",
            self::Child => "Child",
            self::Teen => "Teen",
            self::YoungAdult => "Young Adult",
            self::Adult => "Adult",
            self::MiddleAge => "Middle Age",
            self::Senior => "Senior",
            self::Plus3 => "+3",
            self::Minus3 => "-3",
            self::Plus5 => "+5",
            self::Minus5 => "-5",
            self::Plus18 => "+18",
        };
    }

    public function ageRange(): string
    {
        return match ($this) {
            self::AllAges => "All",
            self::Infant => "0-2",
            self::Toddler => "3-5",
            self::Child => "6-12",
            self::Teen => "13-17",
            self::YoungAdult => "18-25",
            self::Adult => "26-40",
            self::MiddleAge => "41-60",
            self::Senior => "61+",
            self::Plus3 => "+3",
            self::Minus3 => "-3",
            self::Plus5 => "+5",
            self::Minus5 => "-5",
            self::Plus18 => "+18",
        };
    }
}


<?php

namespace App\Enums\Categories;


enum GenderEnum:int
{
    case Male = 1;
    case Female = 2;
    case Other = 3;
    case All = 4; // For unisex/both genders (perfumes, home goods, etc.)


    public function label(): string
    {
        return match ($this){
            self::Male => "Male",
            self::Female => "Female",
            self::Other => "Other",
            self::All => "All Genders (Unisex)",
        };
    }

    public function shortLabel(): string
    {
        return match ($this){
            self::Male => "Male",
            self::Female => "Female",
            self::Other => "Other",
            self::All => "All",
        };
    }
}



EDITS:


'related_categories' => [
                                'nested' => ['path' => 'categories'],
                                'aggs' => [
                                    'categories_with_gender_age' => [
                                        'terms' => [
                                            'field' => 'categories.id',
                                            'size' => $filtersSize
                                        ],
                                        'aggs' => [
                                            'category_details' => [
                                                'top_hits' => [
                                                    'size' => 1,
                                                    '_source' => [
                                                        'includes' => [
                                                            'categories.id',
                                                            'categories.num_available_product',
                                                            'categories.parent_id',
                                                            'categories.gender',
                                                            'categories.group_age',
                                                            'categories.most_viewed_product_thumbnail'
                                                        ]
                                                    ]
                                                ]
                                            ]
                                        ]
                                    ]
                                ]
                            ],
                            // ====== CUSTOM CATEGORIES للـ RELATED CATEGORIES ======
                            'related_custom_categories' => [
                                'nested' => ['path' => 'custom_categories'],
                                'aggs' => [
                                    'filtered_categories' => [
                                        'filter' => [
                                            'term' => ['custom_categories.language_code' => $languageCode]
                                        ],
                                        'aggs' => [
                                            'categories_by_id' => [
                                                'terms' => [
                                                    'field' => 'custom_categories.category_id',
                                                    'size' => $filtersSize
                                                ],
                                                'aggs' => [
                                                    'category_details' => [
                                                        'top_hits' => [
                                                            'size' => 1,
                                                            '_source' => [
                                                                'includes' => [
                                                                    'custom_categories.id',
                                                                    'custom_categories.category_id',
                                                                    'custom_categories.name',
                                                                    'custom_categories.slug',
                                                                    'custom_categories.bio',
                                                                    'custom_categories.description',
                                                                    'custom_categories.flat_photo_path',
                                                                    'custom_categories.png_photo_path',
                                                                    'custom_categories.fill_photo_path',
                                                                    'custom_categories.banner_photo_path',
                                                                ]
                                                            ]
                                                        ]
                                                    ],
                                                    'to_product' => [
                                                        'reverse_nested' => (object) [],
                                                        'aggs' => [
                                                            'product_thumbnail' => [
                                                                'top_hits' => [
                                                                    'size' => 1,
                                                                    '_source' => [
                                                                        'includes' => ['thumbnail']
                                                                    ]
                                                                ]
                                                            ]
                                                        ]
                                                    ],
                                                ]
                                            ]
                                        ]
                                    ]
                                ]
                            ],


$origMap = [];
        $genderAgePairs = []; // Store unique pairs (gender, group_age)
        foreach ($origBuckets as $b) {
            $hit = $b['orig_category_details']['hits']['hits'][0]['_source'] ?? [];
            if (!empty($hit['id'])) {
                $origMap[$hit['id']] = [
                    'num_available_product' => $hit['num_available_product'] ?? 0,
                    'parent_id' => $hit['parent_id'] ?? null,
                    'most_viewed_product_thumbnail' => $hit['most_viewed_product_thumbnail'] ?? null,
                    'gender' => $hit['gender'] ?? null,
                    'group_age' => $hit['group_age'] ?? null,
                ];

                // Extract unique gender and group_age pairs (ignore null values)
                // Check if the value exists and is not null
                if (isset($hit['gender']) && $hit['gender'] !== null && isset($hit['group_age']) && $hit['group_age'] !== null) {
                    $pairKey = $hit['gender'] . '_' . $hit['group_age'];
                    $genderAgePairs[$pairKey] = [
                        'gender' => $hit['gender'],
                        'group_age' => $hit['group_age']
                    ];
                }
            }
        }

// ======  Related Categories ======
        $relatedCategoriesFilter = [];

        if (!empty($genderAgePairs)) {
            // Get IDs of basic categories to exclude
            $existingCategoryIds = array_keys($origMap);

            $relatedOrigBuckets = $aggregations['related_categories']
            ['categories_with_gender_age']['buckets'] ?? [];

            $relatedOrigMap = [];
            foreach ($relatedOrigBuckets as $bucket) {
                $relatedHit = $bucket['category_details']['hits']['hits'][0]['_source'] ?? [];
                $relatedCatId = $relatedHit['id'] ?? null;

                if (
                    $relatedCatId
                    // && !in_array($relatedCatId, $existingCategoryIds)
                ) {
                    $relatedOrigMap[$relatedCatId] = [
                        'num_available_product' => $relatedHit['num_available_product'] ?? 0,
                        'parent_id' => $relatedHit['parent_id'] ?? null,
                        'gender' => $relatedHit['gender'] ?? null,
                        'group_age' => $relatedHit['group_age'] ?? null,
                        'most_viewed_product_thumbnail' => $relatedHit['most_viewed_product_thumbnail'] ?? null,
                    ];
                }
            }


            $relatedCustomBuckets = $aggregations['related_custom_categories']
            ['filtered_categories']['categories_by_id']['buckets'] ?? [];


            foreach ($relatedCustomBuckets as $bucket) {
                $customCat = $bucket['category_details']['hits']['hits'][0]['_source'] ?? [];
                $catId = $bucket['key'];


                if (!isset($relatedOrigMap[$catId])) {
                    continue;
                }

                // Exclude basic categories that are already present
                // if (in_array($catId, $existingCategoryIds)) {
                // continue;
                // }

                $relatedOrig = $relatedOrigMap[$catId];
                $relatedGender = $relatedOrig['gender'];
                $relatedGroupAge = $relatedOrig['group_age'];

                // Check if there is a match in gender & group_age pairs
                if ($relatedGender !== null && $relatedGroupAge !== null) {
                    $pairKey = $relatedGender . '_' . $relatedGroupAge;

                    if (isset($genderAgePairs[$pairKey])) {
                        // Get thumbnail
                        $thumbHit = $bucket['to_product']['product_thumbnail']['hits']['hits'][0]['_source'] ?? [];
                        $thumbnail = $thumbHit['thumbnail'] ?? null;

                        $relatedCategoriesFilter[] = [
                            'id' => $customCat['id'] ?? $catId,
                            'category_id' => $customCat['category_id'] ?? $catId,
                            'name' => $customCat['name'] ?? '',
                            'slug' => $customCat['slug'] ?? '',
                            'bio' => $customCat['bio'] ?? '',
                            'description' => $customCat['description'] ?? '',
                            'flat_photo_path' => $customCat['flat_photo_path'] ?? '',
                            'png_photo_path' => $customCat['png_photo_path'] ?? '',
                            'fill_photo_path' => $customCat['fill_photo_path'] ?? '',
                            'banner_photo_path' => $customCat['banner_photo_path'] ?? '',
                            'num_available_product' => $relatedOrig['num_available_product'],
                            'parent_id' => $relatedOrig['parent_id'],
                            'most_viewed_product_thumbnail' => $relatedOrig['most_viewed_product_thumbnail'] ?? $thumbnail,
                            'gender' => $relatedGender,
                            'group_age' => $relatedGroupAge,
                            'childes' => [],
                        ];
                    }
                }
            }

            // Build category hierarchy for related categories
            $indexedRelated = [];
            foreach ($relatedCategoriesFilter as $category) {
                $indexedRelated[$category['category_id']] = $category;
            }

            foreach ($indexedRelated as &$category) {
                if ($category['parent_id'] && isset($indexedRelated[$category['parent_id']])) {
                    $indexedRelated[$category['parent_id']]['childes'][] = &$category;
                }
            }
            unset($category);

            // Extract root categories
            $relatedTree = array_filter($indexedRelated, fn($cat) => empty($cat['parent_id']));

            $relatedCategoriesFilter = array_values($relatedTree);
            $relatedCategoriesFilter = self::paginateFilters($relatedCategoriesFilter, $inputInitialized['filters_offset']);

        }

!empty($inputInitialized['priceRange'])
            ? ProductHelper::buildCountryAwarePriceRangeCondition($inputInitialized['priceRange'], $country)
            : null,

public static function buildCountryAwarePriceRangeCondition(array $priceRange, ?string $countryIso): array
    {
        $minPrice = (float) ($priceRange[0] ?? 0);
        $maxPrice = (float) ($priceRange[1] ?? $minPrice);

        $baseRangeCondition = [
            'range' => [
                'offered_price' => [
                    'gte' => $minPrice,
                    'lte' => $maxPrice,
                ],
            ],
        ];

        $countryIso = strtoupper(trim((string) $countryIso));
        if ($countryIso === '') {
            return $baseRangeCondition;
        }

        return [
            'bool' => [
                'should' => [
                    [
                        'nested' => [
                            'path' => 'country_offer_prices',
                            'ignore_unmapped' => true,
                            'query' => [
                                'bool' => [
                                    'must' => [
                                        [
                                            'term' => [
                                                'country_offer_prices.country_iso' => $countryIso,
                                            ],
                                        ],
                                        [
                                            'range' => [
                                                'country_offer_prices.offer_price' => [
                                                    'gte' => $minPrice,
                                                    'lte' => $maxPrice,
                                                ],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                    [
                        'bool' => [
                            'must' => [
                                [
                                    'bool' => [
                                        'must_not' => [
                                            [
                                                'nested' => [
                                                    'path' => 'country_offer_prices',
                                                    'ignore_unmapped' => true,
                                                    'query' => [
                                                        'term' => [
                                                            'country_offer_prices.country_iso' => $countryIso,
                                                        ],
                                                    ],
                                                ],
                                            ],
                                        ],
                                    ],
                                ],
                                $baseRangeCondition,
                            ],
                        ],
                    ],
                ],
                'minimum_should_match' => 1,
            ],
        ];
    }

$result['price'] = ProductHelper::resolveUnitPriceForCountry($product, $country);
        $result['offer_price'] = ProductHelper::resolveOfferPriceForCountry($product, $country);


public static function resolveUnitPriceForCountry(array $product, ?string $countryIso): float
    {
        $baseUnitPrice = (float) ($product['unit_price']);
        $baseOfferPrice = (float) ($product['offered_price'] ?? $baseUnitPrice);
        $countryIso = strtoupper(trim((string) $countryIso));

        if ($countryIso === '') {
            return $baseUnitPrice;
        }

        $countryOfferPrices = self::normalizeCountryOfferPrices($product['country_offer_prices'] ?? null);
        foreach ($countryOfferPrices as $countryOfferPrice) {
            if (($countryOfferPrice['country_iso'] ?? null) !== $countryIso) {
                continue;
            }

            if (isset($countryOfferPrice['extra_price']) && is_numeric($countryOfferPrice['extra_price'])) {
                return max(0.0, $baseUnitPrice + (float) $countryOfferPrice['extra_price']);
            }

            if (isset($countryOfferPrice['offer_price']) && is_numeric($countryOfferPrice['offer_price'])) {
                $derivedExtra = (float) $countryOfferPrice['offer_price'] - $baseOfferPrice;
                return max(0.0, $baseUnitPrice + $derivedExtra);
            }
        }

        $normalizedExtraPrices = self::normalizeExtraPriceForCountry($product['extra_price_for_country'] ?? null) ?? [];
        foreach ($normalizedExtraPrices as $item) {
            if (!is_array($item)) {
                continue;
            }
            $itemCountryIso = strtoupper(trim((string) ($item['country_iso'] ?? '')));
            if ($itemCountryIso !== $countryIso) {
                continue;
            }

            $extraPrice = isset($item['extra_price']) && is_numeric($item['extra_price'])
                ? (float) $item['extra_price']
                : 0.0;

            return max(0.0, $baseUnitPrice + $extraPrice);
        }

        return $baseUnitPrice;
    }


private static function normalizeCountryOfferPrices(mixed $value): array
    {
        if ($value === null || $value === '') {
            return [];
        }

        if (is_string($value)) {
            $decoded = json_decode($value, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                return [];
            }
            $value = $decoded;
        }

        if (!is_array($value)) {
            return [];
        }

        $normalized = [];
        foreach ($value as $item) {
            if (!is_array($item)) {
                continue;
            }

            $countryIso = strtoupper(trim((string) ($item['country_iso'] ?? '')));
            if ($countryIso === '') {
                continue;
            }

            $offerPrice = isset($item['offer_price']) && is_numeric($item['offer_price'])
                ? (float) $item['offer_price']
                : null;
            if ($offerPrice === null) {
                continue;
            }

            $normalized[$countryIso] = [
                'country_iso' => $countryIso,
                'offer_price' => $offerPrice,
                'extra_price' => isset($item['extra_price']) && is_numeric($item['extra_price'])
                    ? (float) $item['extra_price']
                    : 0.0,
            ];
        }

        return array_values($normalized);
    }


private static function normalizeCountryOfferPrices(mixed $value): array
    {
        if ($value === null || $value === '') {
            return [];
        }

        if (is_string($value)) {
            $decoded = json_decode($value, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                return [];
            }
            $value = $decoded;
        }

        if (!is_array($value)) {
            return [];
        }

        $normalized = [];
        foreach ($value as $item) {
            if (!is_array($item)) {
                continue;
            }

            $countryIso = strtoupper(trim((string) ($item['country_iso'] ?? '')));
            if ($countryIso === '') {
                continue;
            }

            $offerPrice = isset($item['offer_price']) && is_numeric($item['offer_price'])
                ? (float) $item['offer_price']
                : null;
            if ($offerPrice === null) {
                continue;
            }

            $normalized[$countryIso] = [
                'country_iso' => $countryIso,
                'offer_price' => $offerPrice,
                'extra_price' => isset($item['extra_price']) && is_numeric($item['extra_price'])
                    ? (float) $item['extra_price']
                    : 0.0,
            ];
        }

        return array_values($normalized);
    }

private static function normalizeCountryOfferPrices(mixed $value): array
    {
        if ($value === null || $value === '') {
            return [];
        }

        if (is_string($value)) {
            $decoded = json_decode($value, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                return [];
            }
            $value = $decoded;
        }

        if (!is_array($value)) {
            return [];
        }

        $normalized = [];
        foreach ($value as $item) {
            if (!is_array($item)) {
                continue;
            }

            $countryIso = strtoupper(trim((string) ($item['country_iso'] ?? '')));
            if ($countryIso === '') {
                continue;
            }

            $offerPrice = isset($item['offer_price']) && is_numeric($item['offer_price'])
                ? (float) $item['offer_price']
                : null;
            if ($offerPrice === null) {
                continue;
            }

            $normalized[$countryIso] = [
                'country_iso' => $countryIso,
                'offer_price' => $offerPrice,
                'extra_price' => isset($item['extra_price']) && is_numeric($item['extra_price'])
                    ? (float) $item['extra_price']
                    : 0.0,
            ];
        }

        return array_values($normalized);
    }

public static function normalizeExtraPriceForCountry(mixed $value): array|null
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (is_string($value)) {
            $decoded = json_decode($value, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                return null;
            }
            $value = $decoded;
        }

        return is_array($value) ? $value : null;
    }

public static function resolveOfferPriceForCountry(array $product, ?string $countryIso): float
    {
        $baseOfferPrice = (float) ($product['offered_price'] ?? $product['unit_price'] ?? 0);
        $countryIso = strtoupper(trim((string) $countryIso));

        if ($countryIso === '') {
            return $baseOfferPrice;
        }

        $countryOfferPrices = self::normalizeCountryOfferPrices($product['country_offer_prices'] ?? null);
        foreach ($countryOfferPrices as $countryOfferPrice) {
            if (($countryOfferPrice['country_iso'] ?? null) === $countryIso) {
                return (float) ($countryOfferPrice['offer_price'] ?? $baseOfferPrice);
            }
        }

        // Backward compatibility: derive from legacy extra_price_for_country when country_offer_prices is absent.
        $normalizedExtraPrices = self::normalizeExtraPriceForCountry($product['extra_price_for_country'] ?? null) ?? [];
        foreach ($normalizedExtraPrices as $item) {
            if (!is_array($item)) {
                continue;
            }
            $itemCountryIso = strtoupper(trim((string) ($item['country_iso'] ?? '')));
            if ($itemCountryIso !== $countryIso) {
                continue;
            }

            $extraPrice = isset($item['extra_price']) && is_numeric($item['extra_price'])
                ? (float) $item['extra_price']
                : 0.0;

            return max(0.0, $baseOfferPrice + $extraPrice);
        }

        return $baseOfferPrice;
    }


class PriceCatalogFilter
{

    public static function execute(array $products, ?string $countryIso = null): ?array
    {
        $finalPrices = null;

        $productsForFilters = collect($products);

        $minOfferPrice = $productsForFilters->min(function ($product) use ($countryIso) {
            return ProductHelper::resolveOfferPriceForCountry($product, $countryIso);
        });

        $maxOfferPrice = $productsForFilters->max(function ($product) use ($countryIso) {
            return ProductHelper::resolveOfferPriceForCountry($product, $countryIso);
        });

        if ($minOfferPrice < $maxOfferPrice) {
            $priceRanges = [];

            $diff = ($maxOfferPrice - $minOfferPrice) / 4;
            $boundaries = [
                $minOfferPrice,
                $minOfferPrice + $diff,
                $minOfferPrice + $diff * 2,
                $minOfferPrice + $diff * 3,
                $maxOfferPrice
            ];

            $prices = [
                [
                    'min_price' => $boundaries[0],
                    'max_price' => $boundaries[1],
                ],
                [
                    'min_price' => $boundaries[1],
                    'max_price' => $boundaries[2],
                ],
                [
                    'min_price' => $boundaries[2],
                    'max_price' => $boundaries[3],
                ],
                [
                    'min_price' => $boundaries[3],
                    'max_price' => $boundaries[4],
                ]
            ];

            if ($productsForFilters->isNotEmpty()) {
                $productPrices = $productsForFilters->map(function ($product) use ($countryIso) {
                    return ProductHelper::resolveOfferPriceForCountry($product, $countryIso);
                });

                foreach ($prices as $priceRange) {
                    $count = $productPrices->filter(function ($offerPrice) use ($priceRange) {
                        return $priceRange['min_price'] <= $offerPrice && $offerPrice <= $priceRange['max_price'];
                    })->count();

                    $priceRanges[] = [
                        'min_price' => $priceRange['min_price'],
                        'max_price' => $priceRange['max_price'],
                        'products_count' => $count
                    ];
                }
            } else {
                \Log::warning('PriceCatalogFilter: No products data available for price filter.');
            }
        }
        if ($minOfferPrice < $maxOfferPrice) {
            $finalPrices = [
                'min_price' => $minOfferPrice,
                'max_price' => $maxOfferPrice,
                'priceRanges' => $priceRanges
            ];
        }

        return $finalPrices;
    }

}

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

type Table<Row extends Record<string, unknown>, Insert extends Record<string, unknown>, Update extends Record<string, unknown> = Partial<Insert>> = {
  Row: Row
  Insert: Insert
  Update: Update
  Relationships: []
}

export interface Database {
  public: {
    Tables: {
      categories: Table<
        {
          id: string
          name: string
          slug: string
          description: string
          image_url: string | null
          seo_title: string | null
          meta_description: string | null
          sort_order: number
          is_published: boolean
          created_at: string
          updated_at: string
        },
        {
          id?: string
          name: string
          slug: string
          description?: string
          image_url?: string | null
          seo_title?: string | null
          meta_description?: string | null
          sort_order?: number
          is_published?: boolean
        }
      >
      prompts: Table<
        {
          id: string
          title: string
          slug: string
          excerpt: string
          prompt_text: string
          negative_prompt: string | null
          instructions: string | null
          personalization_tips: string | null
          expected_result: string | null
          category_id: string
          tags: string[]
          model_name: string | null
          art_style: string | null
          aspect_ratio: string | null
          resolution: string | null
          use_case: string | null
          difficulty: string | null
          language: string
          seo_title: string | null
          meta_description: string | null
          canonical_url: string | null
          og_title: string | null
          og_description: string | null
          og_image_url: string | null
          indexing_preference: string
          status: 'draft' | 'published' | 'archived' | 'trashed'
          is_featured: boolean
          published_at: string | null
          scheduled_at: string | null
          created_by: string
          created_at: string
          updated_at: string
          deleted_at: string | null
        },
        {
          id?: string
          title: string
          slug: string
          excerpt: string
          prompt_text: string
          negative_prompt?: string | null
          instructions?: string | null
          personalization_tips?: string | null
          expected_result?: string | null
          category_id: string
          tags?: string[]
          model_name?: string | null
          art_style?: string | null
          aspect_ratio?: string | null
          resolution?: string | null
          use_case?: string | null
          difficulty?: string | null
          language?: string
          seo_title?: string | null
          meta_description?: string | null
          canonical_url?: string | null
          og_title?: string | null
          og_description?: string | null
          og_image_url?: string | null
          indexing_preference?: string
          status?: 'draft' | 'published' | 'archived' | 'trashed'
          is_featured?: boolean
          published_at?: string | null
          scheduled_at?: string | null
          created_by: string
          updated_at?: string
        }
      >
      prompt_images: Table<
        {
          id: string
          prompt_id: string
          storage_path: string
          alt_text: string
          caption: string | null
          sort_order: number
          is_primary: boolean
          mime_type: string
          file_size: number
          width: number | null
          height: number | null
          created_at: string
        },
        {
          id?: string
          prompt_id: string
          storage_path: string
          alt_text?: string
          caption?: string | null
          sort_order?: number
          is_primary?: boolean
          mime_type: string
          file_size: number
          width?: number | null
          height?: number | null
        }
      >
      site_settings: Table<
        {
          id: string
          key: string
          value: Json
          updated_at: string
          updated_by: string | null
        },
        {
          id?: string
          key: string
          value: Json
          updated_by?: string | null
        }
      >
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

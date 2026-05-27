export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          slug: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          slug: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      coupons: {
        Row: {
          active: boolean;
          code: string;
          created_at: string;
          expires_at: string | null;
          id: string;
          max_uses: number | null;
          min_order_total: number;
          one_per_customer: boolean;
          starts_at: string | null;
          type: Database["public"]["Enums"]["coupon_type"];
          updated_at: string;
          uses_count: number;
          value: number;
        };
        Insert: {
          active?: boolean;
          code: string;
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          max_uses?: number | null;
          min_order_total?: number;
          one_per_customer?: boolean;
          starts_at?: string | null;
          type: Database["public"]["Enums"]["coupon_type"];
          updated_at?: string;
          uses_count?: number;
          value: number;
        };
        Update: {
          active?: boolean;
          code?: string;
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          max_uses?: number | null;
          min_order_total?: number;
          one_per_customer?: boolean;
          starts_at?: string | null;
          type?: Database["public"]["Enums"]["coupon_type"];
          updated_at?: string;
          uses_count?: number;
          value?: number;
        };
        Relationships: [];
      };
      energies: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          slug: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          slug: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          created_at: string;
          id: string;
          order_id: string;
          product_id: string | null;
          product_image: string | null;
          product_name: string;
          quantity: number;
          subtotal: number;
          unit_price: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          order_id: string;
          product_id?: string | null;
          product_image?: string | null;
          product_name: string;
          quantity: number;
          subtotal: number;
          unit_price: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          order_id?: string;
          product_id?: string | null;
          product_image?: string | null;
          product_name?: string;
          quantity?: number;
          subtotal?: number;
          unit_price?: number;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          address_cep: string;
          address_city: string;
          address_complement: string | null;
          address_line: string;
          address_number: string;
          address_state: string;
          canceled_at: string | null;
          coupon_code: string | null;
          coupon_id: string | null;
          created_at: string;
          customer_email: string;
          customer_name: string;
          customer_phone: string;
          discount: number;
          id: string;
          paid_at: string | null;
          payment_id: string | null;
          payment_expires_at: string | null;
          payment_method: string;
          payment_provider: string;
          payment_status: Database["public"]["Enums"]["payment_status"];
          payment_status_detail: string | null;
          pix_copy_paste: string | null;
          pix_qr_code: string | null;
          shipping: number;
          status: Database["public"]["Enums"]["order_status"];
          subtotal: number;
          total: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          address_cep: string;
          address_city: string;
          address_complement?: string | null;
          address_line: string;
          address_number: string;
          address_state: string;
          canceled_at?: string | null;
          coupon_code?: string | null;
          coupon_id?: string | null;
          created_at?: string;
          customer_email: string;
          customer_name: string;
          customer_phone: string;
          discount?: number;
          id?: string;
          paid_at?: string | null;
          payment_id?: string | null;
          payment_expires_at?: string | null;
          payment_method: string;
          payment_provider?: string;
          payment_status?: Database["public"]["Enums"]["payment_status"];
          payment_status_detail?: string | null;
          pix_copy_paste?: string | null;
          pix_qr_code?: string | null;
          shipping?: number;
          status?: Database["public"]["Enums"]["order_status"];
          subtotal: number;
          total: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          address_cep?: string;
          address_city?: string;
          address_complement?: string | null;
          address_line?: string;
          address_number?: string;
          address_state?: string;
          canceled_at?: string | null;
          coupon_code?: string | null;
          coupon_id?: string | null;
          created_at?: string;
          customer_email?: string;
          customer_name?: string;
          customer_phone?: string;
          discount?: number;
          id?: string;
          paid_at?: string | null;
          payment_id?: string | null;
          payment_expires_at?: string | null;
          payment_method?: string;
          payment_provider?: string;
          payment_status?: Database["public"]["Enums"]["payment_status"];
          payment_status_detail?: string | null;
          pix_copy_paste?: string | null;
          pix_qr_code?: string | null;
          shipping?: number;
          status?: Database["public"]["Enums"]["order_status"];
          subtotal?: number;
          total?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_coupon_id_fkey";
            columns: ["coupon_id"];
            isOneToOne: false;
            referencedRelation: "coupons";
            referencedColumns: ["id"];
          },
        ];
      };
      product_energies: {
        Row: {
          energy_id: string;
          product_id: string;
        };
        Insert: {
          energy_id: string;
          product_id: string;
        };
        Update: {
          energy_id?: string;
          product_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_energies_energy_id_fkey";
            columns: ["energy_id"];
            isOneToOne: false;
            referencedRelation: "energies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_energies_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          category_id: string | null;
          created_at: string;
          description: string;
          discount_percent: number;
          featured: boolean;
          id: string;
          image: string;
          name: string;
          price: number;
          promo: boolean;
          slug: string;
          stock: number;
          subcategory_id: string | null;
          updated_at: string;
        };
        Insert: {
          category_id?: string | null;
          created_at?: string;
          description?: string;
          discount_percent?: number;
          featured?: boolean;
          id?: string;
          image?: string;
          name: string;
          price: number;
          promo?: boolean;
          slug: string;
          stock?: number;
          subcategory_id?: string | null;
          updated_at?: string;
        };
        Update: {
          category_id?: string | null;
          created_at?: string;
          description?: string;
          discount_percent?: number;
          featured?: boolean;
          id?: string;
          image?: string;
          name?: string;
          price?: number;
          promo?: boolean;
          slug?: string;
          stock?: number;
          subcategory_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_subcategory_id_fkey";
            columns: ["subcategory_id"];
            isOneToOne: false;
            referencedRelation: "subcategories";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          full_name: string | null;
          id: string;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          full_name?: string | null;
          id: string;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          full_name?: string | null;
          id?: string;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      subcategories: {
        Row: {
          category_id: string;
          created_at: string;
          id: string;
          name: string;
          slug: string;
          updated_at: string;
        };
        Insert: {
          category_id: string;
          created_at?: string;
          id?: string;
          name: string;
          slug: string;
          updated_at?: string;
        };
        Update: {
          category_id?: string;
          created_at?: string;
          id?: string;
          name?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subcategories_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      place_order: {
        Args: {
          _coupon_code: string;
          _customer: Json;
          _items: Json;
          _payment_method: string;
        };
        Returns: string;
      };
      place_order_for_user: {
        Args: {
          _coupon_code: string;
          _customer: Json;
          _items: Json;
          _payment_method: string;
          _user_id: string;
        };
        Returns: string;
      };
      update_order_status: {
        Args: {
          _order_id: string;
          _payment_status?: Database["public"]["Enums"]["payment_status"];
          _status: Database["public"]["Enums"]["order_status"];
        };
        Returns: undefined;
      };
    };
    Enums: {
      app_role: "admin" | "customer";
      coupon_type: "percent" | "fixed";
      order_status: "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled";
      payment_status: "pending" | "paid" | "failed" | "refunded" | "expired";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "customer"],
      coupon_type: ["percent", "fixed"],
      order_status: ["pending", "paid", "processing", "shipped", "delivered", "cancelled"],
      payment_status: ["pending", "paid", "failed", "refunded", "expired"],
    },
  },
} as const;

class InvoiceItemGenerator
  attr_reader :daily_reports, :display_pattern

  DISPLAY_PATTERN_BY_REPORT = "by_report".freeze
  DISPLAY_PATTERN_AGGREGATED = "aggregated".freeze

  def initialize(daily_reports:, display_pattern: DISPLAY_PATTERN_BY_REPORT)
    @daily_reports = daily_reports
    @display_pattern = display_pattern
  end

  def generate
    case display_pattern
    when DISPLAY_PATTERN_AGGREGATED
      generate_aggregated
    else
      generate_by_report
    end
  end

  private

  def generate_by_report
    items = []
    sort_order = 0

    daily_reports.each do |daily_report|
      items << create_header_item(daily_report, sort_order)
      sort_order += 1

      sort_order = add_products_by_report(daily_report, items, sort_order)
      sort_order = add_materials_by_report(daily_report, items, sort_order)
    end

    items
  end

  def create_header_item(daily_report, sort_order)
    {
      item_type: "header",
      name: "#{daily_report.report_date.strftime("%m/%d")}作業分",
      sort_order: sort_order,
    }
  end

  def add_products_by_report(daily_report, items, sort_order)
    return sort_order unless daily_report.respond_to?(:daily_report_products)

    daily_report.daily_report_products.includes(:product).find_each do |drp|
      product = drp.product
      next unless product

      items << build_product_item(product, drp.quantity, sort_order)
      sort_order += 1
    end

    sort_order
  end

  def add_materials_by_report(daily_report, items, sort_order)
    return sort_order unless daily_report.respond_to?(:daily_report_materials)

    daily_report.daily_report_materials.includes(:material).find_each do |drm|
      material = drm.material
      next unless material

      items << build_material_item(material, drm.quantity, sort_order)
      sort_order += 1
    end

    sort_order
  end

  def build_product_item(product, quantity, sort_order)
    {
      item_type: "product",
      name: product.name,
      quantity: quantity,
      unit: product.unit,
      unit_price: product.unit_price,
      source_product_id: product.id,
      sort_order: sort_order,
    }
  end

  def build_material_item(material, quantity, sort_order)
    {
      item_type: "material",
      name: material.name,
      quantity: quantity,
      unit: material.unit,
      unit_price: material.unit_price,
      source_material_id: material.id,
      sort_order: sort_order,
    }
  end

  def generate_aggregated
    product_aggregates = {}
    material_aggregates = {}

    daily_reports.each do |daily_report|
      aggregate_products(daily_report, product_aggregates)
      aggregate_materials(daily_report, material_aggregates)
    end

    build_aggregated_items(product_aggregates, material_aggregates)
  end

  def aggregate_products(daily_report, aggregates)
    return unless daily_report.respond_to?(:daily_report_products)

    daily_report.daily_report_products.includes(:product).find_each do |drp|
      product = drp.product
      next unless product

      key = product.id
      if aggregates[key]
        aggregates[key][:quantity] += drp.quantity
      else
        aggregates[key] = build_product_item(product, drp.quantity, 0)
      end
    end
  end

  def aggregate_materials(daily_report, aggregates)
    return unless daily_report.respond_to?(:daily_report_materials)

    daily_report.daily_report_materials.includes(:material).find_each do |drm|
      material = drm.material
      next unless material

      key = material.id
      if aggregates[key]
        aggregates[key][:quantity] += drm.quantity
      else
        aggregates[key] = build_material_item(material, drm.quantity, 0)
      end
    end
  end

  def build_aggregated_items(product_aggregates, material_aggregates)
    items = []
    sort_order = 0

    product_aggregates.each_value do |item|
      items << item.merge(sort_order: sort_order)
      sort_order += 1
    end

    material_aggregates.each_value do |item|
      items << item.merge(sort_order: sort_order)
      sort_order += 1
    end

    items
  end
end

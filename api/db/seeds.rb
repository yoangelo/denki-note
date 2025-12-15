# 開発用の初期データ
if Rails.env.development?
  # ロール作成
  admin_role = Role.find_or_create_by!(name: "admin") do |r|
    r.display_name = "管理者"
    r.description = "全ての操作が可能"
  end
  Rails.logger.debug { "ロール作成: #{admin_role.display_name}" }

  member_role = Role.find_or_create_by!(name: "member") do |r|
    r.display_name = "メンバー"
    r.description = "日報の作成・編集が可能"
  end
  Rails.logger.debug { "ロール作成: #{member_role.display_name}" }

  # テナント作成
  tenant = Tenant.find_or_create_by!(name: "テスト会社")
  Rails.logger.debug { "テナント作成: #{tenant.name}" }

  # テナント設定
  TenantSetting.find_or_create_by!(tenant: tenant) do |ts|
    ts.default_unit_rate = 3000
    ts.money_rounding = "round"
  end
  Rails.logger.debug "テナント設定作成"

  # 顧客作成
  customer1 = Customer.find_or_create_by!(
    tenant: tenant,
    name: "株式会社ABC建設"
  ) do |c|
    c.customer_type = "corporate"
    c.corporation_number = "1234567890123"
    c.rate_percent = 120
  end
  Rails.logger.debug { "顧客作成: #{customer1.name}" }

  customer2 = Customer.find_or_create_by!(
    tenant: tenant,
    name: "DEF商事"
  ) do |c|
    c.customer_type = "corporate"
    c.rate_percent = 100
  end
  Rails.logger.debug { "顧客作成: #{customer2.name}" }

  customer3 = Customer.find_or_create_by!(
    tenant: tenant,
    name: "田中太郎"
  ) do |c|
    c.customer_type = "individual"
    c.rate_percent = 110
  end
  Rails.logger.debug { "顧客作成: #{customer3.name}" }

  # 現場作成
  site1 = Site.find_or_create_by!(
    tenant: tenant,
    customer: customer1,
    name: "〇〇市役所"
  ) do |s|
    s.address = "東京都新宿区西新宿1-1-1"
  end
  Rails.logger.debug { "現場作成: #{site1.name}" }

  site2 = Site.find_or_create_by!(
    tenant: tenant,
    customer: customer1,
    name: "△△小学校"
  ) do |s|
    s.address = "東京都渋谷区渋谷2-2-2"
  end
  Rails.logger.debug { "現場作成: #{site2.name}" }

  site3 = Site.find_or_create_by!(
    tenant: tenant,
    customer: customer2,
    name: "△△倉庫"
  ) do |s|
    s.address = "千葉県千葉市中央区中央3-3-3"
  end
  Rails.logger.debug { "現場作成: #{site3.name}" }

  site4 = Site.find_or_create_by!(
    tenant: tenant,
    customer: customer3,
    name: "田中様宅"
  ) do |s|
    s.address = "神奈川県横浜市中区本町4-4-4"
  end
  Rails.logger.debug { "現場作成: #{site4.name}" }

  # 作業者作成（管理者+メンバー）
  users = []

  # 管理者ユーザー
  admin_user = User.find_or_create_by!(email: "admin@example.com") do |u|
    u.tenant = tenant
    u.display_name = "管理者"
    u.password = "Password123!"
    u.password_confirmation = "Password123!"
    u.is_active = true
  end
  admin_user.add_role("admin")
  users << admin_user
  Rails.logger.debug { "管理者作成: #{admin_user.display_name} (#{admin_user.email})" }

  # メンバーユーザー
  ["田中", "佐藤", "鈴木", "高橋", "山田"].each_with_index do |name, index|
    user = User.find_or_create_by!(email: "test#{index + 1}@example.com") do |u|
      u.tenant = tenant
      u.display_name = name
      u.password = "Password123!"
      u.password_confirmation = "Password123!"
      u.is_active = true
    end
    user.add_role("member")
    users << user
    Rails.logger.debug { "メンバー作成: #{user.display_name} (#{user.email})" }
  end

  # メーカー作成
  manufacturer1 = Manufacturer.find_or_create_by!(name: "ダイキン工業")
  manufacturer2 = Manufacturer.find_or_create_by!(name: "パナソニック")
  manufacturer3 = Manufacturer.find_or_create_by!(name: "三菱電機")
  Rails.logger.debug "メーカー作成完了"

  # 製品マスタ作成（3件以上）
  product1 = Product.find_or_create_by!(
    tenant: tenant,
    name: "ルームエアコン 6畳用"
  ) do |p|
    p.manufacturer = manufacturer1
    p.model_number = "S22ZTES-W"
    p.unit_price = 85000
    p.unit = "台"
  end

  product2 = Product.find_or_create_by!(
    tenant: tenant,
    name: "ルームエアコン 10畳用"
  ) do |p|
    p.manufacturer = manufacturer1
    p.model_number = "S28ZTES-W"
    p.unit_price = 115000
    p.unit = "台"
  end

  product3 = Product.find_or_create_by!(
    tenant: tenant,
    name: "LED照明器具"
  ) do |p|
    p.manufacturer = manufacturer2
    p.model_number = "LGC55120"
    p.unit_price = 18000
    p.unit = "台"
  end

  product4 = Product.find_or_create_by!(
    tenant: tenant,
    name: "換気扇"
  ) do |p|
    p.manufacturer = manufacturer3
    p.model_number = "VD-15Z12"
    p.unit_price = 12000
    p.unit = "台"
  end
  products = [product1, product2, product3, product4]
  Rails.logger.debug "製品マスタ作成完了"

  # 資材マスタ作成（3件以上）
  material1 = Material.find_or_create_by!(
    tenant: tenant,
    name: "VVFケーブル 2.0mm"
  ) do |m|
    m.material_type = "電線"
    m.model_number = "VVF2.0-2C"
    m.unit_price = 120
    m.unit = "m"
  end

  material2 = Material.find_or_create_by!(
    tenant: tenant,
    name: "配管パイプ"
  ) do |m|
    m.material_type = "配管材"
    m.model_number = "EP-20"
    m.unit_price = 350
    m.unit = "m"
  end

  material3 = Material.find_or_create_by!(
    tenant: tenant,
    name: "コンセント（2口）"
  ) do |m|
    m.material_type = "配線器具"
    m.model_number = "WN1302"
    m.unit_price = 450
    m.unit = "個"
  end

  material4 = Material.find_or_create_by!(
    tenant: tenant,
    name: "スイッチ（片切）"
  ) do |m|
    m.material_type = "配線器具"
    m.model_number = "WN5001"
    m.unit_price = 280
    m.unit = "個"
  end
  materials = [material1, material2, material3, material4]
  Rails.logger.debug "資材マスタ作成完了"

  # 口座情報作成（2件以上、デフォルト設定あり）
  bank_account1 = BankAccount.find_or_create_by!(
    tenant: tenant,
    bank_name: "みずほ銀行",
    branch_name: "新宿支店"
  ) do |ba|
    ba.account_type = "ordinary"
    ba.account_number = "1234567"
    ba.account_holder = "カ）テストカイシャ"
    ba.is_default_for_invoice = true
  end

  bank_account2 = BankAccount.find_or_create_by!(
    tenant: tenant,
    bank_name: "三菱UFJ銀行",
    branch_name: "渋谷支店"
  ) do |ba|
    ba.account_type = "ordinary"
    ba.account_number = "7654321"
    ba.account_holder = "カ）テストカイシャ"
    ba.is_default_for_invoice = false
  end
  Rails.logger.debug "口座情報作成完了"

  # サンプル日報とエントリ作成（今月分）
  today = Time.zone.today
  start_date = today.beginning_of_month
  end_date = today

  daily_reports = []

  (start_date..end_date).each do |date|
    # 平日のみ作業
    next if date.saturday? || date.sunday?

    # ABC建設の現場で作業
    if rand < 0.7
      selected_site = [site1, site2].sample
      existing_report1 = DailyReport.find_by(tenant: tenant, site: selected_site, work_date: date)

      if existing_report1
        report1 = existing_report1
      else
        work_entries_attrs = users.sample(rand(2..4)).map do |user|
          {
            tenant: tenant,
            user: user,
            summary: ["配線作業", "機器設置", "動作確認", "配管工事", "清掃・片付け"].sample,
            minutes: [60, 90, 120, 180, 240].sample,
          }
        end

        report1 = DailyReport.create!(
          tenant: tenant,
          site: selected_site,
          work_date: date,
          created_by: users.first.id,
          summary: ["配線作業", "機器設置", "動作確認", "配管工事", "清掃・片付け"].sample,
          work_entries_attributes: work_entries_attrs
        )
      end

      daily_reports << report1
    end

    # DEF商事の現場で作業
    next unless rand < 0.5

    existing_report2 = DailyReport.find_by(tenant: tenant, site: site3, work_date: date)

    if existing_report2
      report2 = existing_report2
    else
      work_entries_attrs2 = users.sample(rand(1..3)).map do |user|
        {
          tenant: tenant,
          user: user,
          summary: ["照明取付", "配線工事", "スイッチ設置", "ブレーカー工事"].sample,
          minutes: [30, 45, 60, 90, 120].sample,
        }
      end

      report2 = DailyReport.create!(
        tenant: tenant,
        site: site3,
        work_date: date,
        created_by: users.first.id,
        summary: ["照明取付", "配線工事", "スイッチ設置", "ブレーカー工事"].sample,
        work_entries_attributes: work_entries_attrs2
      )
    end

    daily_reports << report2
  end

  Rails.logger.debug "サンプル日報データ作成完了"

  # 日報に製品・資材を紐づけ
  daily_reports.each_with_index do |report, index|
    # 約半分の日報に製品を紐づけ
    if index.even? && products.any?
      selected_products = products.sample(rand(1..2))
      selected_products.each do |product|
        DailyReportProduct.find_or_create_by!(
          daily_report: report,
          product: product
        ) do |drp|
          drp.quantity = rand(1..3)
        end
      end
    end

    # 約半分の日報に資材を紐づけ
    next unless index.odd? && materials.any?

    selected_materials = materials.sample(rand(1..3))
    selected_materials.each do |material|
      DailyReportMaterial.find_or_create_by!(
        daily_report: report,
        material: material
      ) do |drm|
        drm.quantity = [1, 2, 5, 10, 20].sample
      end
    end
  end

  Rails.logger.debug "日報と製品・資材の紐づけ完了"
  Rails.logger.debug "初期データ投入完了"

  # 統計表示
  Rails.logger.debug "\n=== データ統計 ==="
  Rails.logger.debug { "テナント数: #{Tenant.count}" }
  Rails.logger.debug { "顧客数: #{Customer.count}" }
  Rails.logger.debug { "現場数: #{Site.count}" }
  Rails.logger.debug { "作業者数: #{User.count}" }
  Rails.logger.debug { "日報数: #{DailyReport.count}" }
  Rails.logger.debug { "作業エントリ数: #{WorkEntry.count}" }
  Rails.logger.debug { "メーカー数: #{Manufacturer.count}" }
  Rails.logger.debug { "製品数: #{Product.count}" }
  Rails.logger.debug { "資材数: #{Material.count}" }
  Rails.logger.debug { "口座数: #{BankAccount.count}" }
  Rails.logger.debug { "日報×製品: #{DailyReportProduct.count}" }
  Rails.logger.debug { "日報×資材: #{DailyReportMaterial.count}" }
  Rails.logger.debug "=================="
end

# 開発用の初期データ
if Rails.env.development?
  # ロール作成
  admin_role = Role.find_or_create_by!(name: "admin") do |r|
    r.display_name = "管理者"
    r.description = "全ての操作が可能"
  end
  puts "ロール作成: #{admin_role.display_name}"

  member_role = Role.find_or_create_by!(name: "member") do |r|
    r.display_name = "メンバー"
    r.description = "日報の作成・編集が可能"
  end
  puts "ロール作成: #{member_role.display_name}"

  # テナント作成
  tenant = Tenant.find_or_create_by!(name: "テスト会社")
  puts "テナント作成: #{tenant.name}"

  # テナント設定
  tenant_setting = TenantSetting.find_or_create_by!(tenant: tenant) do |ts|
    ts.default_unit_rate = 3000
    ts.money_rounding = "round"
  end
  puts "テナント設定作成"

  # 顧客作成
  customer1 = Customer.find_or_create_by!(
    tenant: tenant,
    name: "株式会社ABC建設"
  ) do |c|
    c.customer_type = "corporate"
    c.corporation_number = "1234567890123"
    c.rate_percent = 120
  end
  puts "顧客作成: #{customer1.name}"

  customer2 = Customer.find_or_create_by!(
    tenant: tenant,
    name: "DEF商事"
  ) do |c|
    c.customer_type = "corporate"
    c.rate_percent = 100
  end
  puts "顧客作成: #{customer2.name}"

  customer3 = Customer.find_or_create_by!(
    tenant: tenant,
    name: "田中太郎"
  ) do |c|
    c.customer_type = "individual"
    c.rate_percent = 110
  end
  puts "顧客作成: #{customer3.name}"

  # 現場作成
  site1 = Site.find_or_create_by!(
    tenant: tenant,
    customer: customer1,
    name: "〇〇市役所"
  ) do |s|
    s.note = "エアコン設置工事"
  end
  puts "現場作成: #{site1.name}"

  site2 = Site.find_or_create_by!(
    tenant: tenant,
    customer: customer1,
    name: "△△小学校"
  ) do |s|
    s.note = "電気設備更新"
  end
  puts "現場作成: #{site2.name}"

  site3 = Site.find_or_create_by!(
    tenant: tenant,
    customer: customer2,
    name: "△△倉庫"
  ) do |s|
    s.note = "照明設備工事"
  end
  puts "現場作成: #{site3.name}"

  site4 = Site.find_or_create_by!(
    tenant: tenant,
    customer: customer3,
    name: "田中様宅"
  ) do |s|
    s.note = "エアコン取付"
  end
  puts "現場作成: #{site4.name}"

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
  puts "管理者作成: #{admin_user.display_name} (#{admin_user.email})"

  # メンバーユーザー
  ["田中", "佐藤", "鈴木", "高橋", "山田"].each_with_index do |name, index|
    user = User.find_or_create_by!(email: "test#{index+1}@example.com") do |u|
      u.tenant = tenant
      u.display_name = name
      u.password = "Password123!"
      u.password_confirmation = "Password123!"
      u.is_active = true
    end
    user.add_role("member")
    users << user
    puts "メンバー作成: #{user.display_name} (#{user.email})"
  end

  # サンプル日報とエントリ作成（今月分）
  today = Date.today
  start_date = today.beginning_of_month
  end_date = today

  (start_date..end_date).each do |date|
    # 平日のみ作業
    next if date.saturday? || date.sunday?

    # ABC建設の現場で作業
    if rand < 0.7
      report1 = DailyReport.find_or_create_by!(
        tenant: tenant,
        site: [site1, site2].sample,
        work_date: date
      ) do |dr|
        dr.created_by = users.first.id
        dr.summary = ["配線作業", "機器設置", "動作確認", "配管工事", "清掃・片付け"].sample
      end

      # 作業者ごとにエントリ作成
      users.sample(rand(2..4)).each do |user|
        WorkEntry.find_or_create_by!(
          tenant: tenant,
          daily_report: report1,
          user: user
        ) do |we|
          we.summary = ["配線作業", "機器設置", "動作確認", "配管工事", "清掃・片付け"].sample
          we.minutes = [60, 90, 120, 180, 240].sample
        end
      end
    end

    # DEF商事の現場で作業
    if rand < 0.5
      report2 = DailyReport.find_or_create_by!(
        tenant: tenant,
        site: site3,
        work_date: date
      ) do |dr|
        dr.created_by = users.first.id
        dr.summary = ["照明取付", "配線工事", "スイッチ設置", "ブレーカー工事"].sample
      end

      users.sample(rand(1..3)).each do |user|
        WorkEntry.find_or_create_by!(
          tenant: tenant,
          daily_report: report2,
          user: user
        ) do |we|
          we.summary = ["照明取付", "配線工事", "スイッチ設置", "ブレーカー工事"].sample
          we.minutes = [30, 45, 60, 90, 120].sample
        end
      end
    end
  end

  puts "サンプル日報データ作成完了"
  puts "初期データ投入完了"

  # 統計表示
  puts "\n=== データ統計 ==="
  puts "テナント数: #{Tenant.count}"
  puts "顧客数: #{Customer.count}"
  puts "現場数: #{Site.count}"
  puts "作業者数: #{User.count}"
  puts "日報数: #{DailyReport.count}"
  puts "作業エントリ数: #{WorkEntry.count}"
  puts "=================="
end

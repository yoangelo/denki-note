class Ability
  include CanCan::Ability

  def initialize(user)
    user ||= User.new

    if user.admin?
      can :manage, :all
    elsif user.member?
      can :read, :all
      can [:create, :update], DailyReport, created_by: user
      can [:create, :update], WorkEntry, daily_report: { created_by: user }
    else
      can :read, :all
    end
  end
end

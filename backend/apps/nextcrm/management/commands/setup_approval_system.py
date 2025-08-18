"""
Management command to set up the approval system for NextCRM.
This creates required reference data and links existing users to traders.
"""

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.db import transaction
from apps.nextcrm.models import Commodity_Type, Sociedad, Trader
from apps.authentication.models import UserProfile


class Command(BaseCommand):
    help = 'Set up approval system and trader linking for NextCRM'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Setting up approval system...'))
        
        with transaction.atomic():
            self.create_required_commodity_types()
            self.create_required_sociedades()
            self.link_users_to_traders()
            self.approve_existing_admin_user()
        
        self.stdout.write(self.style.SUCCESS('Approval system setup completed successfully!'))

    def create_required_commodity_types(self):
        """Create the required commodity types for user access control"""
        required_types = [
            {'commodity_type_name': 'seeds', 'description': 'Seeds and seed products'},
            {'commodity_type_name': 'oil', 'description': 'Oil and oil products'},
            {'commodity_type_name': 'meal', 'description': 'Meal and meal products'},
        ]
        
        created_count = 0
        for data in required_types:
            _, created = Commodity_Type.objects.get_or_create(
                commodity_type_name=data['commodity_type_name'],
                defaults=data
            )
            if created:
                created_count += 1
        
        self.stdout.write(f'Created {created_count} required commodity types')

    def create_required_sociedades(self):
        """Create the required sociedades for user access control"""
        required_sociedades = [
            {
                'sociedad_name': 'Sovena España, S.A',
                'tax_id': 'ESA12345678',
                'address': 'Calle Principal, Madrid, España'
            },
        ]
        
        created_count = 0
        for data in required_sociedades:
            _, created = Sociedad.objects.get_or_create(
                sociedad_name=data['sociedad_name'],
                defaults=data
            )
            if created:
                created_count += 1
        
        self.stdout.write(f'Created {created_count} required sociedades')

    def link_users_to_traders(self):
        """Link existing active users to traders and set up access control"""
        # Get required commodity types and sociedades
        seeds = Commodity_Type.objects.filter(commodity_type_name='seeds').first()
        oil = Commodity_Type.objects.filter(commodity_type_name='oil').first()
        meal = Commodity_Type.objects.filter(commodity_type_name='meal').first()
        sovena = Sociedad.objects.filter(sociedad_name='Sovena España, S.A').first()
        
        if not all([seeds, oil, meal, sovena]):
            self.stdout.write(self.style.WARNING('Missing required reference data for user-trader linking'))
            return
        
        # Get active users who don't have traders yet
        active_users = User.objects.filter(is_active=True).exclude(trader__isnull=False)
        linked_count = 0
        
        for user in active_users:
            # Ensure user has a profile
            profile, _ = UserProfile.objects.get_or_create(user=user)
            
            # Create or get trader for this user
            trader, created = Trader.get_or_create_for_user(user)
            
            if created or not trader.allowed_commodity_types.exists():
                # Set up access control - grant access to all commodity types and sovena by default
                trader.allowed_commodity_types.set([seeds, oil, meal])
                trader.allowed_sociedades.set([sovena])
                linked_count += 1
                
                self.stdout.write(f'Linked user {user.username} to trader {trader.trader_name}')
        
        self.stdout.write(f'Linked {linked_count} users to traders with access control')

    def approve_existing_admin_user(self):
        """Approve existing admin users automatically"""
        admin_users = User.objects.filter(is_staff=True, is_active=True)
        approved_count = 0
        
        for user in admin_users:
            profile, _ = UserProfile.objects.get_or_create(user=user)
            if not profile.is_approved:
                profile.is_approved = True
                profile.save()
                approved_count += 1
                self.stdout.write(f'Auto-approved admin user: {user.username}')
        
        self.stdout.write(f'Auto-approved {approved_count} admin users')
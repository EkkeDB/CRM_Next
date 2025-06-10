'use client'

import { useState } from 'react'
import { Search, Filter, Plus, MoreHorizontal, Phone, Mail } from 'lucide-react'

interface Contact {
  id: number
  name: string
  email: string
  account: string
  deals: string
  phone: string
  activities: number
  status: 'active' | 'inactive'
}

const contacts: Contact[] = [
  {
    id: 1,
    name: 'Robert Thompson',
    email: 'robert@amazon.com',
    account: 'Amazon',
    deals: 'Amazon deal',
    phone: '(773) 614-2345',
    activities: 1,
    status: 'active'
  },
  {
    id: 2,
    name: 'Steven Scott',
    email: 'steven@google.com',
    account: 'Google',
    deals: 'Google deal',
    phone: '(516) 671-9514',
    activities: 1,
    status: 'active'
  },
  {
    id: 3,
    name: 'Sam Jones',
    email: 'sam@apple.com',
    account: 'Apple',
    deals: 'Apple deal',
    phone: '(345) 726-0479',
    activities: 1,
    status: 'active'
  }
]

export default function ContactsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  
  const activeContacts = contacts.filter(contact => contact.status === 'active')
  const inactiveContacts = contacts.filter(contact => contact.status === 'inactive')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Left Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 shadow-sm">
        <div className="p-4">
          <h1 className="text-xl font-semibold text-gray-800 mb-6">NextCRM</h1>
          
          <nav className="space-y-2">
            <div className="text-sm text-gray-500 mb-3">MAIN</div>
            <a href="#" className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
              More email tracking
            </a>
            <a href="#" className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
              Sequences
            </a>
            <a href="#" className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
              Quotes and Invoices
            </a>
            <a href="#" className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
              Virtual events
            </a>
            <a href="#" className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
              More
            </a>
            <a href="#" className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
              Favorites
            </a>
            
            <div className="text-sm text-gray-500 mb-3 mt-6">CRM</div>
            <a href="#" className="flex items-center px-3 py-2 text-sm font-medium text-cyan-600 bg-cyan-50 rounded-md">
              <span className="w-2 h-2 bg-cyan-500 rounded-full mr-3"></span>
              Contacts
            </a>
            <a href="#" className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md ml-5">
              Deals
            </a>
            <a href="#" className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md ml-5">
              Leads
            </a>
            <a href="#" className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md ml-5">
              Accounts
            </a>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Contacts</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your contacts</p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50">
              Sequences
            </button>
            <button className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50">
              Import
            </button>
            <button className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50">
              Integrate
            </button>
            <button className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50">
              Automate
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50">
            <Filter className="w-4 h-4 mr-2" />
            Person
          </button>
          <button className="flex items-center px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50">
            Filter
          </button>
          <button className="flex items-center px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50">
            Group by
          </button>
        </div>

        {/* Active Contacts Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex items-center px-4 py-3 border-b border-gray-200">
            <div className="w-4 h-4 bg-cyan-500 rounded mr-3"></div>
            <h2 className="text-lg font-medium text-gray-900">Active Contacts</h2>
            <span className="ml-2 text-sm text-gray-500">({activeContacts.length})</span>
          </div>
          
          {/* Table Header */}
          <div className="grid grid-cols-6 gap-4 px-4 py-3 bg-gray-50 text-sm font-medium text-gray-700 border-b border-gray-200">
            <div>Contact</div>
            <div>Email</div>
            <div>Accounts</div>
            <div>Deals</div>
            <div>Phone</div>
            <div>Activities</div>
          </div>
          
          {/* Table Rows */}
          {activeContacts.map((contact) => (
            <div key={contact.id} className="grid grid-cols-6 gap-4 px-4 py-4 border-b border-gray-100 hover:bg-gray-50">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                  {contact.name.split(' ').map(n => n[0]).join('')}
                </div>
                <span className="text-gray-900">{contact.name}</span>
              </div>
              <div className="flex items-center text-cyan-600">
                <Mail className="w-4 h-4 mr-2" />
                {contact.email}
              </div>
              <div className="flex items-center text-gray-600">
                {contact.account}
              </div>
              <div className="flex items-center text-gray-600">
                {contact.deals}
              </div>
              <div className="flex items-center text-cyan-600">
                <Phone className="w-4 h-4 mr-2" />
                {contact.phone}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">{contact.activities}</span>
                <button className="p-1 hover:bg-gray-100 rounded">
                  <MoreHorizontal className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Inactive Contacts Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center px-4 py-3 border-b border-gray-200">
            <div className="w-4 h-4 bg-red-500 rounded mr-3"></div>
            <h2 className="text-lg font-medium text-gray-900">Inactive Contacts</h2>
            <span className="ml-2 text-sm text-gray-500">(0)</span>
          </div>
          
          <div className="px-4 py-8 text-center text-gray-500">
            <p>No inactive contacts</p>
          </div>
        </div>

        {/* Add Button */}
        <button className="fixed bottom-6 right-6 w-12 h-12 bg-cyan-500 hover:bg-cyan-600 text-white rounded-full shadow-lg flex items-center justify-center">
          <Plus className="w-6 h-6" />
        </button>
      </div>
    </div>
  )
}
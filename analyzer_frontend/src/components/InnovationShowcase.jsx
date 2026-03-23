import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Brain, 
  Users, 
  Building, 
  GraduationCap, 
  Code, 
  Shield, 
  Zap, 
  Target,
  Lightbulb,
  Rocket,
  CheckCircle,
  TrendingUp,
  Award
} from 'lucide-react';

export default function InnovationShowcase() {
  const innovationData = {
    title: "CodeSight AI",
    subtitle: "Intelligent Code Analysis & Detection Platform",
    tagline: "Revolutionizing Code Quality with AI-Powered Insights",
    
    coreInnovation: [
      {
        icon: Brain,
        title: "Dual AI Detection System",
        description: "Separate AI models for comprehensive code analysis and AI-generated content detection",
        color: "text-purple-600"
      },
      {
        icon: Shield,
        title: "Microservices Architecture",
        description: "Scalable, modular design with dedicated services for different analysis aspects",
        color: "text-blue-600"
      },
      {
        icon: Zap,
        title: "Real-time Code Sandbox",
        description: "Secure environment for testing uploaded projects with instant feedback",
        color: "text-green-600"
      },
      {
        icon: Award,
        title: "Intelligent Innovation Scoring",
        description: "AI-powered assessment of project creativity and real-world applicability",
        color: "text-orange-600"
      }
    ],

    targetAudience: [
      {
        icon: Code,
        title: "For Developers",
        benefits: [
          "Code Quality Assurance - Identifies AI-generated vs human-written code",
          "Innovation Benchmarking - Scores projects (Basic/Moderate/Innovative)",
          "Automated Code Reviews - Provides strengths, weaknesses, and suggestions",
          "Security Analysis - Detects vulnerabilities and architectural issues"
        ],
        color: "bg-blue-50 border-blue-200"
      },
      {
        icon: Building,
        title: "For Organizations",
        benefits: [
          "Recruitment Screening - Evaluates candidate coding projects for authenticity",
          "Code Audit Compliance - Ensures code quality standards across teams",
          "Learning & Development - Helps developers improve coding practices",
          "Project Assessment - Quick evaluation of project viability and innovation"
        ],
        color: "bg-green-50 border-green-200"
      },
      {
        icon: GraduationCap,
        title: "For Educational Sector",
        benefits: [
          "Academic Integrity - Detects AI-generated content in student submissions",
          "Learning Analytics - Provides detailed feedback on coding quality",
          "Skill Assessment - Evaluates technical innovation and problem-solving",
          "Curriculum Enhancement - Identifies areas for improvement in teaching"
        ],
        color: "bg-purple-50 border-purple-200"
      },
      {
        icon: Users,
        title: "For Open Source Communities",
        benefits: [
          "Quality Maintenance - Ensures code quality in collaborative projects",
          "Contribution Validation - Verifies authenticity of submitted code",
          "Community Standards - Maintains coding standards across contributors",
          "Project Health Monitoring - Tracks overall codebase quality"
        ],
        color: "bg-orange-50 border-orange-200"
      }
    ],

    marketImpact: [
      {
        icon: TrendingUp,
        title: "Market Disruption",
        description: "Addressing the growing need for automated code evaluation in the AI era"
      },
      {
        icon: Target,
        title: "Industry Need",
        description: "Essential for maintaining code quality as AI-generated code becomes prevalent"
      },
      {
        icon: Rocket,
        title: "Technical Innovation",
        description: "Multi-model AI integration with chunk-based processing for large codebases"
      }
    ],

    keyFeatures: [
      "Multi-Model AI Integration (Gemini, OpenAI, Groq)",
      "Intelligent Token Management & Chunk Processing",
      "Robust API Handling with Rate Limiting",
      "Real-time Background Job Processing",
      "Comprehensive Code Analysis Pipeline",
      "Secure Sandbox Environment"
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="text-center mb-8">
          <Badge className="mb-4 text-sm px-4 py-2 bg-purple-100 text-purple-800 border-purple-200">
            <Lightbulb className="w-4 h-4 mr-2" />
            Innovation Showcase
          </Badge>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            {innovationData.title}
          </h1>
          <p className="text-2xl text-gray-600 mb-2">
            {innovationData.subtitle}
          </p>
          <p className="text-lg text-gray-500 italic">
            {innovationData.tagline}
          </p>
        </div>
      </div>

      {/* Core Innovation Section */}
      <div className="max-w-7xl mx-auto mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          🚀 Core Innovation
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {innovationData.coreInnovation.map((item, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className={`inline-flex p-3 rounded-full bg-gray-50 mb-4`}>
                    <item.icon className={`w-8 h-8 ${item.color}`} />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Target Audience Section */}
      <div className="max-w-7xl mx-auto mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          🎯 Who It Helps
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {innovationData.targetAudience.map((audience, index) => (
            <Card key={index} className={`${audience.color} border-2 hover:shadow-lg transition-shadow`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-white/50`}>
                    <audience.icon className="w-6 h-6" />
                  </div>
                  {audience.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {audience.benefits.map((benefit, benefitIndex) => (
                    <li key={benefitIndex} className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Market Impact Section */}
      <div className="max-w-7xl mx-auto mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          📈 Market Impact
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {innovationData.marketImpact.map((impact, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="inline-flex p-3 rounded-full bg-blue-50 mb-4">
                  <impact.icon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{impact.title}</h3>
                <p className="text-gray-600 text-sm">{impact.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Key Features Section */}
      <div className="max-w-7xl mx-auto">
        <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <CardHeader>
            <CardTitle className="text-2xl text-center">🔧 Technical Excellence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {innovationData.keyFeatures.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-300 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Call to Action */}
      <div className="max-w-7xl mx-auto mt-12 text-center">
        <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">
          <CardContent className="pt-8 pb-8">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Revolutionize Your Code Analysis?
            </h2>
            <p className="text-lg mb-6 opacity-90">
              Join the future of intelligent code evaluation and quality assurance
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" className="bg-white text-orange-600 hover:bg-gray-100">
                Get Started
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-orange-600">
                Learn More
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

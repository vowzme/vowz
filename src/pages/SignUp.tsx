import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Heart, CalendarIcon, MapPin, User, Mail, Users, ArrowRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";

const signUpSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().email("Please enter a valid email").max(255),
  partnerName: z.string().trim().min(2, "Partner's name must be at least 2 characters").max(100),
  weddingDate: z.date({ required_error: "Please select your wedding date" }),
  location: z.string().trim().min(2, "Location must be at least 2 characters").max(200),
});

type SignUpForm = z.infer<typeof signUpSchema>;

const SignUp = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const form = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      partnerName: "",
      location: "",
    },
  });

  const steps = [
    { fields: ["name", "email"] as const, title: "Let's get started", subtitle: "Tell us about yourself" },
    { fields: ["partnerName", "weddingDate"] as const, title: "About your celebration", subtitle: "Tell us about your partner & date" },
    { fields: ["location"] as const, title: "Almost there!", subtitle: "Where's the celebration?" },
  ];

  const currentStep = steps[step];

  const canGoNext = () => {
    const fields = currentStep.fields;
    return fields.every((f) => {
      const val = form.getValues(f);
      return val !== undefined && val !== "";
    }) && fields.every((f) => !form.getFieldState(f).error);
  };

  const handleNext = async () => {
    const valid = await form.trigger(currentStep.fields as any);
    if (!valid) return;
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      form.handleSubmit(onSubmit)();
    }
  };

  const onSubmit = (data: SignUpForm) => {
    toast({
      title: "Welcome to ShaadiSite! 🎉",
      description: `Let's build your wedding site, ${data.name} & ${data.partnerName}!`,
    });
    navigate("/wizard");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left decorative panel - hidden on mobile */}
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-hero relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full border border-primary-foreground/20"
              style={{
                width: `${200 + i * 120}px`,
                height: `${200 + i * 120}px`,
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
            />
          ))}
        </div>
        <div className="relative z-10 text-center px-12">
          <Heart className="w-10 h-10 text-gold mx-auto mb-6" fill="currentColor" />
          <h2 className="font-display text-4xl font-bold text-primary-foreground mb-4">
            Begin Your <span className="text-gradient-gold italic">Journey</span>
          </h2>
          <p className="font-body text-primary-foreground/70 leading-relaxed">
            Create a beautiful wedding website that captures your unique love story — in just minutes.
          </p>
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-3 mt-10">
            {steps.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  i === step ? "w-10 bg-gold" : i < step ? "w-6 bg-gold/60" : "w-6 bg-primary-foreground/20"
                )}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Heart className="w-5 h-5 text-gold" fill="currentColor" />
            <span className="font-display text-xl font-bold text-foreground">ShaadiSite</span>
          </div>

          {/* Mobile step indicator */}
          <div className="lg:hidden flex items-center gap-2 mb-6">
            {steps.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === step ? "w-8 bg-gold" : i < step ? "w-5 bg-gold/60" : "w-5 bg-border"
                )}
              />
            ))}
            <span className="ml-auto text-xs text-muted-foreground font-body">
              Step {step + 1} of {steps.length}
            </span>
          </div>

          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="font-display text-3xl font-bold text-foreground mb-1">
              {currentStep.title}
            </h1>
            <p className="text-muted-foreground font-body mb-8">{currentStep.subtitle}</p>

            <Form {...form}>
              <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
                {step === 0 && (
                  <>
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-body text-sm font-medium">Your Name</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                placeholder="Enter your full name"
                                className="pl-10 h-12 font-body"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-body text-sm font-medium">Email Address</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                type="email"
                                placeholder="you@example.com"
                                className="pl-10 h-12 font-body"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                {step === 1 && (
                  <>
                    <FormField
                      control={form.control}
                      name="partnerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-body text-sm font-medium">Partner's Name</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                placeholder="Enter your partner's name"
                                className="pl-10 h-12 font-body"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="weddingDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="font-body text-sm font-medium">Wedding Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "h-12 pl-10 text-left font-body font-normal w-full justify-start",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="absolute left-3 w-4 h-4 text-muted-foreground" />
                                  {field.value ? format(field.value, "PPP") : "Pick your wedding date"}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date()}
                                initialFocus
                                className={cn("p-3 pointer-events-auto")}
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                {step === 2 && (
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-body text-sm font-medium">Wedding Location</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              placeholder="City, State (e.g., Kochi, Kerala)"
                              className="pl-10 h-12 font-body"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="flex gap-3 pt-4">
                  {step > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={() => setStep(step - 1)}
                      className="font-body"
                    >
                      <ArrowLeft className="w-4 h-4 mr-1" />
                      Back
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="gold"
                    size="lg"
                    className="flex-1 font-body"
                    onClick={handleNext}
                  >
                    {step === steps.length - 1 ? "Create My Wedding Site" : "Continue"}
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </form>
            </Form>

            <p className="mt-8 text-center text-sm text-muted-foreground font-body">
              Already have an account?{" "}
              <a href="#" className="text-accent font-medium hover:underline">
                Log in
              </a>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;

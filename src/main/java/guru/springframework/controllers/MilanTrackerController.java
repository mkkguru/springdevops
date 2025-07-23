package guru.springframework.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * Controller for Milan Tracker Application
 * Handles routing for the IT Milan tracking system
 */
@Controller
public class MilanTrackerController {

    @RequestMapping("/milan-tracker")
    public String getMilanTracker(Model model) {
        model.addAttribute("pageTitle", "IT Milan Tracker");
        return "milan-tracker";
    }

    @RequestMapping("/milan")
    public String getMilan(Model model) {
        // Redirect to the main Milan tracker page
        return "redirect:/milan-tracker";
    }
}
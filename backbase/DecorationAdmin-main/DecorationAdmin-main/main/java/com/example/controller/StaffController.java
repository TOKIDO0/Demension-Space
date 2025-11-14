package com.example.controller;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.date.DateUtil;
import cn.hutool.core.io.FileUtil;
import cn.hutool.core.io.IoUtil;
import cn.hutool.poi.excel.ExcelUtil;
import cn.hutool.poi.excel.ExcelWriter;
import com.example.common.Result;
import com.example.entity.Staff;
import com.example.service.StaffService;
import com.example.entity.User;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import org.springframework.web.bind.annotation.*;
import com.example.exception.CustomException;
import cn.hutool.core.util.StrUtil;

import javax.annotation.Resource;
import javax.servlet.ServletOutputStream;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URLEncoder;
import java.util.*;
import java.math.BigDecimal;

@RestController
@RequestMapping("/api/staff")
public class StaffController {
    @Resource
    private StaffService staffService;
    @Resource
    private HttpServletRequest request;

    public User getUser() {
        User user = (User) request.getSession().getAttribute("user");
        if (user == null) {
            throw new CustomException("-1", "请登录");
        }
        return user;
    }

    @PostMapping
    public Result<?> save(@RequestBody Staff staff) {
        return Result.success(staffService.save(staff));
    }

    @PutMapping
    public Result<?> update(@RequestBody Staff staff) {
        return Result.success(staffService.updateById(staff));
    }

    @DeleteMapping("/{id}")
    public Result<?> delete(@PathVariable Long id) {
        staffService.removeById(id);
        return Result.success();
    }

    @GetMapping("/{id}")
    public Result<?> findById(@PathVariable Long id) {
        return Result.success(staffService.getById(id));
    }

    @GetMapping
    public Result<?> findAll() {
        return Result.success(staffService.list());
    }

    @GetMapping("/page")
    public Result<?> findPage(@RequestParam(required = false, defaultValue = "") String name,
                                                @RequestParam(required = false, defaultValue = "1") Integer pageNum,
                                                @RequestParam(required = false, defaultValue = "10") Integer pageSize) {
        LambdaQueryWrapper<Staff> query = Wrappers.<Staff>lambdaQuery().orderByDesc(Staff::getId);
        if (StrUtil.isNotBlank(name)) {
            query.like(Staff::getName, name);
        }
        return Result.success(staffService.page(new Page<>(pageNum, pageSize), query));
    }

    @GetMapping("/export")
    public void export(HttpServletResponse response) throws IOException {

        List<Map<String, Object>> list = CollUtil.newArrayList();

        List<Staff> all = staffService.list();
        for (Staff obj : all) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("基本工资", obj.getBasicsalary());
            row.put("生日", obj.getBirth());
            row.put("工资卡号", obj.getCard());
            row.put(" 员工id", obj.getId());
            row.put("员工姓名", obj.getName());
            row.put("联系方式", obj.getPhone());
            row.put("性别", obj.getSex());

            list.add(row);
        }

        // 2. 写excel
        ExcelWriter writer = ExcelUtil.getWriter(true);
        writer.write(list, true);

        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8");
        String fileName = URLEncoder.encode("员工信息", "UTF-8");
        response.setHeader("Content-Disposition", "attachment;filename=" + fileName + ".xlsx");

        ServletOutputStream out = response.getOutputStream();
        writer.flush(out, true);
        writer.close();
        IoUtil.close(System.out);
    }

    @GetMapping("/upload/{fileId}")
    public Result<?> upload(@PathVariable String fileId) {
        String basePath = System.getProperty("user.dir") + "/src/main/resources/static/file/";
        List<String> fileNames = FileUtil.listFileNames(basePath);
        String file = fileNames.stream().filter(name -> name.contains(fileId)).findAny().orElse("");
        List<List<Object>> lists = ExcelUtil.getReader(basePath + file).read(1);
        List<Staff> saveList = new ArrayList<>();
        for (List<Object> row : lists) {
            Staff obj = new Staff();
            obj.setBasicsalary(Integer.valueOf((String) row.get(1)));
            obj.setBirth((String) row.get(2));
            obj.setCard((String) row.get(3));
            obj.setName((String) row.get(4));
            obj.setPhone((String) row.get(5));
            obj.setSex((String) row.get(6));

            saveList.add(obj);
        }
        staffService.saveBatch(saveList);
        return Result.success();
    }

}
